#
# Takuhai Tracker worker process on rake
#

require 'dotenv'
require 'logger'
require 'pushbullet_ruby'
require 'timeout'
require_relative '../app'

module TakuhaiTracker::Task
	SERVICES = {
		'JapanPost'      => '日本郵便',
		'KuronekoYamato' => 'ヤマト運輸',
		'Sagawa'         => '佐川急便',
		'TMGCargo'       => 'TMG'
	}.freeze
	class ItemNotFound < StandardError; end
	class ItemExpired  < StandardError; end
	class RetryNext  < StandardError; end

	def self.logger
		begin
			return @@logger;
		rescue NameError
			@@logger = Logger.new($stderr)
			@@logger.lovel = case ENV['LOGLEVEL']
			when /^E/; Logger::ERROR
			when /^D/; Logger::DEBUG
			when /^I/; Logger::INFO
			else
				ENV['RACK_ENV'] == 'production' ? Logger::ERROR : Logger::DEBUG
			end
			return @@logger
		end
	end

	def self.check_item(item)
		logger.info "start checking #{item.key}"

		begin
			status = get_recent_status(item)
		rescue ItemNotFound => e
			# save 1st checking timestamp to countdown for expire
			item.update_attributes!(time: Time.now) unless item.time
			return
		rescue ItemExpired => e
			logger.info "   => remove expired item"
			logger.error "#{e}: remove expired item: key:#{item.key}"
			item.remove
			return
		rescue TakuhaiStatus::NotMyKey
			logger.info "   => removed item or API error"
			logger.error "removed item or API error: #{item.user_id}/#{item.key}"
			return
		end

		if item.state != status.state
			begin
				send_notice(item, status)
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
			logger.info "   => remove item because finished."
			item.remove
		end
	end

	def self.get_recent_status(item)
		if item.service
			begin
				logger.info "   => found existent item of #{item.service}"
				Timeout.timeout(60) do
					return TakuhaiStatus.const_get(item.service).new(item.key)
				end
			rescue TakuhaiStatus::NotMyKey
				raise
			rescue # timeout or other errors
				raise ItemNotFound.new("failed getting item info: [#$!] key:#{item.key}")
			end
		else
			logger.info "   => found unhandled item"
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
		logger.info "   => start notice sending"
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
			logger.info "   => not send with bad setting"
		end
	end

	def self.send_pushbullet_notice(token, service_name, item, body)
		begin
			logger.info "   => send notice via pushbullet"
			client = PushbulletRuby::Client.new(token)
			params = {title: "#{service_name} #{item.key}", body: body}
			client.push_note(id: client.me, params: params)
		rescue StandardError => e
			case e.message
			when /Account has not been used for over a month/
				logger.info "  => #{e.message}"
				raise RetryNext.new(e.message)
			when /Pushbullet Pro is required/
				logger.info "rejected sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
			else
				logger.error "failed sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
			end
		end
	end

	def self.send_ifttt_notice(token, service_name, item, body)
		begin
			logger.info "   => send notice via ifttt webhook"
			ifttt = IftttWebhook.new(token)
			ifttt.post("#{service_name} #{item.key}", body)
		rescue StandardError => e
			logger.error "failed sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"
		end
	end

	def self.update_item(item, status)
		logger.info "   => start item updating"
		item.update_attributes!(
			service: service_name(status),
			time: status.time,
			state: status.state
		)
	end

	def self.service_name(status)
		status.class.to_s.split(/::/).last
	end
end

desc 'Takuhai Tracker Worker'
task :worker do
	Dotenv.load if ENV['RACK_ENV'] == 'production'
	Mongoid::load!('config/mongoid.yml')

	retry_count = 0
	begin
		TakuhaiTracker::Item.all.each do |item|
			TakuhaiTracker::Task.check_item(item)
		end
	rescue Mongo::Error::OperationFailure
		retry_count += 1
		if retry_count < 5 # retry 5 times each 5 seconds
			TakuhaiTracker::Task.logger.info "database operation faiure. retring(#{retry_count})"
			sleep 5
			retry
		else
			raise
		end
	rescue Mongo::Auth::Unauthorized
		retry_count += 1
		if retry_count < 5 # retry 5 times each 5 seconds
			TakuhaiTracker::Task.logger.info "login database faiure. retring(#{retry_count})"
			sleep 5
			retry
		else
			raise
		end
	end
end
