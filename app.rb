#
# application main
#
Bundler.require
require 'omniauth'
require 'omniauth-twitter'

class FixMe < Sinatra::Base
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
	use OmniAuth::Builder do
		provider :twitter, ENV['TWITTER_KEY'], ENV['TWITTER_SECRET']
		#provider :developer unless production?
	end

	configure do
		Mongoid::load!('config/mongoid.yml')
	end

	configure :production do
		raise StandardError.new("not found ENV['TWITTER_KEY']") unless ENV['TWITTER_KEY']
		raise StandardError.new("not found ENV['TWITTER_SECRET']") unless ENV['TWITTER_SECRET']
	end

	get '/' do
		haml :index
	end
end
