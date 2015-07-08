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

	TakuhaiTracker::Item.all.each do |item|
		info "start checking #{item.key}"
		if item.service
			info "   found existent item of #{item.service}"
			item_new = TakuhaiStatus.const_get(item.service).new(item.key)
		else
			info "   found unhandled item"
			item_new = TakuhaiStatus.scan(item.key) rescue nil
		end

		if item_new && item.state != item_new.state
			info "   start state checking"
			setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
			if setting
				Pushbullet.api_token = setting.pushbullet
				Pushbullet::Contact.me.push_note(
					"Takuhai Tracker state update",
					"#{item.service}: #{item_new.state}\n(No.#{item.key})"
				)
			end

			item.update_attributes!(time: item_new.time, state: item_new.state)
		else
			info "   not updated"
		end

		if item_new && item_new.finish?
			info "   remove item because finished."
			item.remove
		end
	end
end
