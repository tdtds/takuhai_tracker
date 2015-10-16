require 'dotenv'
require 'pushbullet'
require './app'

def info(msg)
	puts msg unless ENV['RACK_ENV'] == 'production'
end

desc 'Takuhai Tracker cron task'
task :cron do
	Dotenv.load if ENV['RACK_ENV'] == 'production'
	Mongoid::load!('config/mongoid.yml')

	services = {
		'JapanPost'      => '日本郵便',
		'KuronekoYamato' => 'ヤマト運輸',
		'Sagawa'         => '佐川急便',
		'TMGCargo'       => 'TMG'
	}

	TakuhaiTracker::Item.all.each do |item|
		info "start checking #{item.key}"
		if item.service
			begin
				info "   => found existent item of #{item.service}"
				item_new = TakuhaiStatus.const_get(item.service).new(item.key)
			rescue
				$stderr.puts "failed getting item info: [#$!] key:#{item.key}"
				next
			end
		else
			info "   => found unhandled item"
			item_new = TakuhaiStatus.scan(item.key) rescue nil
			unless item_new
				if item.time
					# remove item after 30 days not updated
					if ((Time.now - item.time) / (60 * 60 * 24 * 30)) > 1
						info "   => try to remove old item"
						$stderr.puts "try to remove old item: key:#{item.key}"
						item.remove
					end
				else
					item.update_attributes!(time: Time.now)
				end
				next
			end
		end

		if item_new && item.state != item_new.state
			info "   => start state checking"
			setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
			if setting && setting.pushbullet && !setting.pushbullet.empty?
				info "   => send notice"
				service_name = services[item.service] || item.service || item_new.class.to_s.split(/::/).last
				body = if item && item.memo && !item.memo.empty?
					"#{item_new.state}\n(#{item.memo})"
				else
					item_new.state
				end
				begin
					Pushbullet.api_token = setting.pushbullet
					Pushbullet::Contact.me.push_note("#{service_name} #{item.key}", body)
				rescue Encoding::InvalidByteSequenceError
					# ignore JSON parse error in pushbullet gem
				rescue StandardError => e
					$stderr.puts "#{e.class}:#{e} #{item.user_id}/#{item.key} => #{setting.pushbullet}"
					next
				end
			end

			item.update_attributes!(
				service: item_new.class.to_s.split(/::/).last,
				time: item_new.time,
				state: item_new.state
			)
		else
			info "   => not updated"
		end

		if item_new && item_new.finish?
			info "   => remove item because finished."
			item.remove
		end
	end
end
