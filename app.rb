#
# application main
#
Bundler.require
require_relative 'models/item'
require_relative 'models/setting'

module TakuhaiTracker
	class App < Sinatra::Base
		set :haml, {format: :html5, escape_html: true}
		enable :logging

		set :assets_precompile, %w(application.js application.css *.png *.jpg *.svg)
		set :assets_css_compressor, :yui
		set :assets_js_compressor, :uglifier
		register Sinatra::AssetPipeline
		if defined?(RailsAssets)
			RailsAssets.load_paths.each do |path|
				settings.sprockets.append_path(path)
			end
		end

		enable :sessions
		configure do
			Mongoid::load!('config/mongoid.yml')
			Mongo::Logger.level = Logger::FATAL
		end

		def pushbullet_valid?(token)
			begin
				Pushbullet.api_token = token
				Pushbullet::Contact.me
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
				return setting.to_json
			end
		end

		post '/:user/setting' do
			user = params[:user]
			pushbullet = params[:pushbullet]
			mail = params[:mail]
			setting = TakuhaiTracker::Setting.find_or_create_by(user_id: user)
			setting.update_attributes!(
				user_id: user,
				pushbullet: pushbullet,
				mail: mail
			)

			setting['pushbullet_validation'] = pushbullet_valid?(pushbullet)
			return setting.to_json
		end

		get '/:user/:key' do
			user = params[:user]
			key = params[:key].gsub(/[^a-zA-Z0-9]/, '')
			return 404 unless user.size == 32

			begin
				service = TakuhaiStatus.scan(key)
				item = TakuhaiTracker::Item.find_or_create_by(user_id: user, key: key)
				item.update_attributes!(
					service: service.class.to_s.split(/::/).last,
					time: service.time,
					state: service.state
				)
			rescue TakuhaiStatus::NotFound
				if key.length >= 12
					TakuhaiTracker::Item.find_or_create_by(user_id: params[:user], key: key)
				end
			rescue Mongoid::Errors::Validations
				return 409, "dupulicated key"
			end
			redirect "/#{user}"
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
			redirect "/#{user}"
		end

		put '/:user/:key' do
			user = params[:user]
			key = params[:key].gsub(/[^a-zA-Z0-9]/, '')
			item = TakuhaiTracker::Item.find_by(user_id: user, key: key)
			return 404 unless item

			item.update_attributes!(memo: params[:memo]) if params[:memo]
			return 200
		end
	end
end
