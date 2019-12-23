#
# application main
#
Bundler.require
require_relative 'models/item'
require_relative 'models/setting'
require_relative 'lib/ifttt_webhook'

module TakuhaiTracker
	class App < Sinatra::Base
		set :haml, {format: :html5}
		enable :logging

		enable :sessions
		configure do
			Mongoid::load!('config/mongoid.yml')
			Mongo::Logger.level = Logger::FATAL
			(ENV['IGNORE_SERVICES'] || '').split(/,/).each do |service|
				unless TakuhaiStatus.ignore_service(service.to_sym)
					logger.warn "invalid ignore service name: #{service}"
				end
			end
		end

		def pushbullet_valid?(token)
			begin
				client = PushbulletRuby::Client.new(token)
				client.me
				return true
			rescue
				return false
			end
		end

		get '/' do
			haml :index
		end

		post '/' do
			require 'securerandom'
			user = SecureRandom.hex
			redirect "/#{user}"
		end

		get '/:user.json' do
			items = TakuhaiTracker::Item.where(user_id: params[:user])
			content_type :json
			return items.to_json
		end

		get '/:user' do
			haml :user, locals: {user: params[:user]}
		end

		post '/:user' do
			redirect "/#{params[:user]}/#{params[:key]}"
		end

		get '/:user/setting.json' do
			user = params[:user]
			setting = TakuhaiTracker::Setting.where(user_id: user).first
			unless setting
				return 404, 'Document not Found'
			else
				setting['pushbullet_validation'] = pushbullet_valid?(setting.pushbullet)
				setting['ifttt_validation'] = IftttWebhook.valid_key?(setting.ifttt)
				content_type :json
				return setting.to_json
			end
		end

		post '/:user/setting' do
			user = params[:user]
			pushbullet = params[:pushbullet]
			ifttt = params[:ifttt]
			mail = params[:mail]
			setting = TakuhaiTracker::Setting.find_or_create_by(user_id: user)
			setting.update_attributes!(
				user_id: user,
				pushbullet: pushbullet,
				ifttt: ifttt,
				mail: mail
			)

			setting['pushbullet_validation'] = pushbullet_valid?(pushbullet)
			setting['ifttt_validation'] = IftttWebhook.valid_key?(ifttt)
			return setting.to_json
		end

		get '/:user/:key' do
			user = params[:user]
			key = params[:key].gsub(/[^a-zA-Z0-9]/, '')
			return 404 unless user.size == 32

			begin
				begin
					service = TakuhaiStatus.scan(key, timeout: 5, logger: logger)
					item = TakuhaiTracker::Item.find_or_create_by(user_id: user, key: key)
					raise Mongoid::Errors::Validations.new(item) unless item.valid?
					unless service.finish?
						item.update_attributes!(
							service: service.class.to_s.split(/::/).last,
							time: service.time,
							state: service.state
						)
					end
				rescue TakuhaiStatus::Multiple
					# if found multiple services, wait to finish other services
					item = TakuhaiTracker::Item.find_or_create_by(user_id: user, key: key)
					raise Mongoid::Errors::Validations.new(item) unless item.valid?
				rescue TakuhaiStatus::NotFound
					if key.length >= 12
						item = TakuhaiTracker::Item.find_or_create_by(user_id: user, key: key)
						raise Mongoid::Errors::Validations.new(item) unless item.valid?
					end
				end
			rescue Mongoid::Errors::Validations
				return 409, "dupulicated key"
			end
			redirect "/#{user}.json"
		end

		delete '/:user/:key' do
			user = params[:user]
			key = params[:key].gsub(/[^a-zA-Z0-9]/, '')
			begin
				item = TakuhaiTracker::Item.find_by(user_id: user, key: key)
			rescue Mongoid::Errors::DocumentNotFound
				return 404
			end

			item.remove
			redirect "/#{user}.json"
		end

		put '/:user/:key' do
			user = params[:user]
			key = params[:key].gsub(/[^a-zA-Z0-9]/, '')
			begin
				item = TakuhaiTracker::Item.find_by(user_id: user, key: key)
			rescue Mongoid::Errors::DocumentNotFound
				return 404
			end

			item.update_attributes!(memo: params[:memo]) if params[:memo]
			redirect "/#{user}.json"
		end
	end
end
