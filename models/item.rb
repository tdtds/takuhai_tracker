require 'mongoid'
require 'takuhai_status'

module TakuhaiTracker
	class Item
		include ::Mongoid::Document
		store_in collection: "items"

		field :user_id, type: String
		validates_presence_of :user_id, allow_nil: false
		field :service, type: String
		field :key, type: String
		validates_uniqueness_of :key
		validates_presence_of :key, allow_nil: false
		field :time, type: Time
		field :status, type: String
	end
end
