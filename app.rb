#
# application main
#
Bundler.require

class TakuhaiTracker < Sinatra::Base
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
end
