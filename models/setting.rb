require 'mongoid'

module TakuhaiTracker
	class Setting
		include ::Mongoid::Document
		store_in collection: "settings"

		field :user_id, type: String
		validates_uniqueness_of :user_id
		validates_presence_of :user_id, allow_nil: false
		field :pushbullet, type: String
		field :mail, type: String
	end
end
