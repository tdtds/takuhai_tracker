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
		'Sagawa'         => '佐川急便'
	}

	TakuhaiTracker::Item.all.each do |item|
		info "start checking #{item.key}"
		if item.service
			info "   => found existent item of #{item.service}"
			item_new = TakuhaiStatus.const_get(item.service).new(item.key)
		else
			info "   => found unhandled item"
			item_new = TakuhaiStatus.scan(item.key) rescue nil
		end

		if item_new && item.state != item_new.state
			info "   => start state checking"
			setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
			if setting && setting.pushbullet && !setting.pushbullet.empty?
				info "   => send notice"
				service_name = services[item.service] || item.service || item_new.class.to_s.split(/::/).last
				Pushbullet.api_token = setting.pushbullet
				begin
					Pushbullet::Contact.me.push_note(
						"Takuhai Tracker state update",
						"#{service_name}: #{item_new.state}\n(No.#{item.key})"
					)
				rescue Pushbullet::Error => e
					$stderr.puts "#{e} #{item.user_id}/#{item.key} => #{setting.pushbullet}"
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
