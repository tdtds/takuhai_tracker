require 'dotenv'
require 'pushbullet'
require './app'

desc 'Takuhai Tracker cron task'
task :cron do
	Dotenv.load if ENV['RACK_ENV'] == 'production'
	Mongoid::load!('config/mongoid.yml')

	TakuhaiTracker::Item.all.each do |item|
		item_new = TakuhaiStatus.const_get(item.service).new(item.key)
		if item.status != item_new.state
			setting = TakuhaiTracker::Setting.where(user_id: item.user_id).first
			if setting
				Pushbullet.api_token = setting.pushbullet
				Pushbullet::Contact.me.push_note(
					"Takuhai Tracker status update",
					"#{item.service}: #{item_new.state}\n(No.#{item.key})"
				)
			end

			item.update_attributes!(time: item_new.time, status: item_new.state)
		end
	end
end
