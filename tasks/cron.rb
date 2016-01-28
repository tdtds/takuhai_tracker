#
# Takuhai Tracker cron task on rake
#

require 'dotenv'
require 'pushbullet'
require './app'

module TakuhaiTracker::Task
	SERVICES = {
		'JapanPost'      => '日本郵便',
		'KuronekoYamato' => 'ヤマト運輸',
		'Sagawa'         => '佐川急便',
		'TMGCargo'       => 'TMG'
	}.freeze
	class ItemNotFound < StandardError; end
	class ItemExpired  < StandardError; end

	def self.check_item(item)
		info "start checking #{item.key}"

		begin
			status = get_recent_status(item)
		rescue ItemNotFound => e
			# save 1st checking timestamp to countdown for expire
			item.update_attributes!(time: Time.now) unless item.time
			return
		rescue ItemExpired => e
			info "   => try to remove old item"
			$stderr.puts "#{e}: try to remove old item: key:#{item.key}"
			item.remove
			return
		end

		if item.state != status.state
			begin
				send_notice(item, status)
			rescue StandardError => e
				$stderr.puts "failed sending notice: #{e.class}:#{e} #{item.user_id}/#{item.key}"

				# retry next chance without error about inactive user
				unless e.message =~ /Account has not been used for over a month/
					return
				end
			end

			begin
				update_item(item, status)
			rescue StandardError => e
				$stderr.puts "failed updating status: #{e.class}:#{e} #{item.user_id}/#{item.key}"
				return
			end
		end

		if status.finish?
			info "   => remove item because finished."
			item.remove
		end
	end

	def self.get_recent_status(item)
		if item.service
			begin
				info "   => found existent item of #{item.service}"
				return TakuhaiStatus.const_get(item.service).new(item.key)
			rescue TakuhaiStatus::NotMyKey
				raise ItemExpired.new("it is not #{item.service}'s code")
			rescue
				raise ItemNotFound.new("failed getting item info: [#$!] key:#{item.key}")
			end
		else
			info "   => found unhandled item"
			begin
				status = TakuhaiStatus.scan(item.key)
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
		info "   => start notice sending"
		setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
		if setting && setting.pushbullet && !setting.pushbullet.empty?
			info "   => send notice via pushbullet"
			service_name = SERVICES[service_name(status)] || service_name(status)
			body = if item && item.memo && !item.memo.empty?
				"#{status.state}\n(#{item.memo})"
			else
				status.state
			end
			Pushbullet.api_token = setting.pushbullet
			Pushbullet::Contact.me.push_note("#{service_name} #{item.key}", body)
		else
			info "   => not send with bad setting"
		end
	end

	def self.update_item(item, status)
		info "   => start item updating"
		item.update_attributes!(
			service: service_name(status),
			time: status.time,
			state: status.state
		)
	end

	def self.service_name(status)
		status.class.to_s.split(/::/).last
	end

	def self.info(msg)
		puts msg unless ENV['RACK_ENV'] == 'production'
	end
end

desc 'Takuhai Tracker cron task'
task :cron do
	Dotenv.load if ENV['RACK_ENV'] == 'production'
	Mongoid::load!('config/mongoid.yml')

	TakuhaiTracker::Item.all.each do |item|
		TakuhaiTracker::Task.check_item(item)
	end
end
