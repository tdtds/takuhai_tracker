source 'https://rubygems.org'

ruby ENV['CUSTOM_RUBY_VERSION'] || '2.2.4'

gem 'sinatra', require: 'sinatra/base'
gem 'sinatra-asset-pipeline', require: 'sinatra/asset_pipeline'
gem 'react-jsx-sprockets', require: 'react-jsx-sprockets'
gem 'uglifier'
gem 'yui-compressor'

gem 'puma'
gem 'haml', require: 'haml'
gem 'mongoid', "~> 5.0", require: 'mongoid'
gem 'bson_ext'
gem 'rack_csrf', require: 'rack/csrf'
gem 'dotenv'
gem 'ruby-pushbullet', require: 'pushbullet'

gem 'takuhai_status', github: 'tdtds/takuhai_status', require: 'takuhai_status'

source 'https://rails-assets.org' do
	gem 'rails-assets-jquery'
	gem 'rails-assets-react'
end

group :development, :test do
	gem 'rake'
	gem 'rspec'
	gem 'autotest'
	gem 'sinatra-reloader', require: 'sinatra/reloader'
	gem 'pry'
end

