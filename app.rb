#
# application main
#
Bundler.require
require_relative 'models/item'

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

		get '/:user/:key' do
			user = params[:user]
			key = params[:key]
			begin
				service = TakuhaiStatus.scan(key)
				item = TakuhaiTracker::Item.find_or_create_by(user_id: user, key: key)
				item.update_attributes!(
					service: service.class.to_s.split(/::/).last,
					time: service.time,
					status: service.state
				)
			rescue TakuhaiStatus::NotFound
				TakuhaiTracker::Item.find_or_create_by(user_id: params[:user], key: key)
			end
			redirect "/#{params[:user]}"
		end
	end
end
