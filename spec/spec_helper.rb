#
# spec_helper.rb
#

$:.unshift File.expand_path(File.join(File.dirname(__FILE__), '..')).untaint
Bundler.require :test if defined?(Bundler)

RSpec.configure do |config|
	require 'mongoid'
	Mongoid::Config.load_configuration({
		clients: {
			default: {
				uri: 'mongodb://localhost:27017/takuhai_tracker_test'
			}
		}
	})
end
