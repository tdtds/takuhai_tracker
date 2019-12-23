#
# Takuhai Tracker worker process on rake
#
# switch mode by environment variebles
#   RACK_ENV: 'production' or not
#   MONGOLAB_URI or MONGODB_URI
#   LOGLEVEL: E, W, I or D
#   DRY_RUN: true: running under dry run mode
#

require 'dotenv'
require 'logger'
require 'pushbullet_ruby'
require 'timeout'
require_relative '../app'

module TakuhaiTracker::Worker
	SERVICES = {
		'JapanPost'      => '日本郵便',
		'KuronekoYamato' => 'ヤマト運輸',
		'Sagawa'         => '佐川急便',
		'TMGCargo'       => 'TMG'
	}.freeze
	(ENV['IGNORE_SERVICES'] || '').split(/,/).each do |service|
		TakuhaiStatus.ignore_service(service)
	end

	class ItemNotFound < StandardError; end
	class ItemExpired  < StandardError; end
	class RetryNext  < StandardError; end

	def self.logger
		begin
			return @@logger;
		rescue NameError
			@@logger = Logger.new($stderr)
			@@logger.level = case ENV['LOGLEVEL']
			when /^E/; Logger::ERROR
			when /^W/; Logger::WARN
			when /^I/; Logger::INFO
			when /^D/; Logger::DEBUG
			else
				ENV['RACK_ENV'] == 'production' ? Logger::ERROR : Logger::DEBUG
			end
			return @@logger
		end
	end

	def self.dry_run?
		return !!(ENV['DRY_RUN'] =~ /^t/i)
	end

	def self.check_item(item)
		logger.debug "start checking #{item.key}"

		begin
			status = get_recent_status(item)
		rescue ItemNotFound => e
			# save 1st checking timestamp to countdown for expire
			item.update_attributes!(time: Time.now) unless item.time || dry_run?
			return
		rescue ItemExpired => e
			logger.debug "   => remove expired item"
			logger.info "#{e}: remove expired item: key:#{item.key}"
			item.remove
			return
		rescue TakuhaiStatus::NotMyKey
			logger.debug "   => removed item or API error"
			logger.error "removed item or API error: #{item.user_id}/#{item.key}"
			return
		end

		if item.state != status.state
			begin
				send_notice(item, status) unless dry_run?
			rescue RetryNext => e
				# retry next chance without status update
				return
			end

			begin
				update_item(item, status)
			rescue StandardError => e
				logger.error "failed updating status: #{e.class}:#{e} #{item.user_id}/#{item.key}"
				return
			end
		end

		if status.finish?
			logger.debug "   => remove item because finished."
			item.remove unless dry_run?
		end
	end

	def self.get_recent_status(item)
		if item.service
			begin
				logger.debug "   => found existent item of #{item.service}"
				Timeout.timeout(60) do
					return TakuhaiStatus.const_get(item.service).new(item.key)
				end
			rescue TakuhaiStatus::NotMyKey
				raise
			rescue # timeout or other errors
				raise ItemNotFound.new("failed getting item info: [#$!] key:#{item.key}")
			end
		else
			logger.debug "   => found unhandled item"
			begin
				status = TakuhaiStatus.scan(item.key, timeout: 60, logger: logger)
			rescue TakuhaiStatus::Multiple => e
				raise ItemNotFound.new("found multiple services: #{e.services}")
			rescue
			end
			if status && status.finish?
				raise ItemNotFound.new("found only finished service: #{status}")
			elsif !status
				# remove item after 30 days not updated
				if item.time && ((Time.now - item.time) / (60 * 60 * 24 * 30)) > 1
					raise ItemExpired.new("status not changed over 30 days")
				end
				raise ItemNotFound.new('')
			end
			return status
		end
	end

	def self.send_notice(item, status)
		logger.debug "   => start notice sending"
		setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
		done = 0
		if setting
			service_name = SERVICES[service_name(status)] || service_name(status)
			body = if item && item.memo && !item.memo.empty?
				"#{status.state}\n(#{item.memo})"
			else
				status.state
			end

			if setting.pushbullet && !setting.pushbullet.empty?
				send_pushbullet_notice(setting.pushbullet, service_name, item, body)
				done += 1
			end
			if setting.ifttt && !setting.ifttt.empty?
				send_ifttt_notice(setting.ifttt, service_name, item, body)
				done += 1
			end
		end
		if done == 0
			logger.debug "   => not send with bad setting"
		end
	end

	def self.send_pushbullet_notice(token, service_name, item, body)
		begin
			logger.debug "   => send notice via pushbullet"
			client = PushbulletRuby::Client.new(token)
			params = {title: "#{service_name} #{item.key}", body: body}
			client.push_note(id: client.me, params: params)
		rescue StandardError => e
			case e.message
			when /Account has not been used for over a month/
				logger.debug "  => #{e.message}"
				raise RetryNext.new(e.message)
			when /Pushbullet Pro is required/
				logger.warn "rejected sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
			else
				logger.error "failed sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
			end
		end
	end

	def self.send_ifttt_notice(token, service_name, item, body)
		begin
			logger.debug "   => send notice via ifttt webhook"
			ifttt = IftttWebhook.new(token)
			ifttt.post("#{service_name} #{item.key}", body)
		rescue StandardError => e
			logger.error "failed sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
		end
	end

	def self.update_item(item, status)
		logger.debug "   => start item updating"
		item.update_attributes!(
			service: service_name(status),
			time: status.time,
			state: status.state
		) unless dry_run?
	end

	def self.service_name(status)
		status.class.to_s.split(/::/).last
	end
end

desc 'Takuhai Tracker Worker'
task :worker do
	logger = TakuhaiTracker::Worker.logger
	logger.debug "running under dry run mode" if TakuhaiTracker::Worker.dry_run?

	Mongoid::load!('config/mongoid.yml')

	retry_count = 0
	begin
		TakuhaiTracker::Item.all.each do |item|
			TakuhaiTracker::Worker.check_item(item)
		end
	rescue Mongo::Error::OperationFailure
		retry_count += 1
		if retry_count < 5 # retry 5 times each 5 seconds
			logger.info "database operation faiure. retring(#{retry_count})"
			sleep 5
			retry
		else
			raise
		end
	rescue Mongo::Auth::Unauthorized
		retry_count += 1
		if retry_count < 5 # retry 5 times each 5 seconds
			logger.debug "login database faiure. retring(#{retry_count})"
			sleep 5
			retry
		else
			raise
		end
	end
end
