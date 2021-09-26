require 'open-uri'
require 'faraday'
require 'json'

class IftttWebhook
	ENTRY = URI('https://maker.ifttt.com/trigger/takuhai_tracker/with/key/')
	CHECK_ENTRY = URI('https://maker.ifttt.com/trigger/takuhai_tracker_test/with/key/')

	def self.valid_key?(key)
		return false if !key or key.empty?
		begin
			# use invalid trigger 'takuhai_tracker_test'
			# to avoid error activity logged on IFTTT
			URI.open("#{CHECK_ENTRY}#{key}", &:read)
			return true
		rescue OpenURI::HTTPError
			return false
		end
	end

	def initialize(key)
		raise ArgumentError.new('invalid key') unless self.class.valid_key?(key)
		@key = key
	end

	def post(title, body, uri = nil)
		msg = {}
		msg['value1'] = title
		msg['value2'] = body
		msg['value3'] = uri if uri

		conn = Faraday.new(url: ENTRY)
		res = conn.post() do |req|
			req.url (ENTRY + @key).path
			req.headers['Content-Type'] = 'application/json'
			req.body = msg.to_json
		end
		res.body
	end
end
