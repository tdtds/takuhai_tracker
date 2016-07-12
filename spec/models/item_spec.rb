#
# spec/models/item_spec.rb
#

require 'models/item'

describe 'TakuhaiTracker::Item' do
	before do
		TakuhaiTracker::Item.delete_all
	end

	describe '.create' do
		context 'append new item' do
			before do
				@item = TakuhaiTracker::Item.create(user_id: '6b52c0a3cec2a8a5a43a08aba0e3c46a', key: 'AB123456789CD')
			end
			subject{ @item }

			describe '#user_id' do
				subject { super().user_id }
				it {is_expected.to eq('6b52c0a3cec2a8a5a43a08aba0e3c46a')}
			end

			describe '#key' do
				subject {super().key }
				it {is_expected.to eq('AB123456789CD')}
			end

			describe 'find exist key' do
				it {
					item = TakuhaiTracker::Item.find_by(user_id: @item.user_id, key: @item.key)
					expect(item.key).to eq(@item.key)
				}
			end

			describe 'fail to find key' do
				it {
					expect {
						item = TakuhaiTracker::Item.find_by(user_id: @item.user_id, key: 'hoge')
					}.to raise_error(Mongoid::Errors::DocumentNotFound)
				}
			end

			describe 'add dupulicated item' do
				it {
					item = TakuhaiTracker::Item.create(user_id: @item.user_id, key: @item.key)
					expect(item.valid?).to be_falsey
				}
			end

			describe 'find or create by exist user and key' do
				it {
					item = TakuhaiTracker::Item.find_or_create_by(user_id: @item.user_id, key: @item.key)
					expect(item.valid?).to be_truthy
				}
			end

			describe 'find or create by exist key and another user' do
				it {
					item = TakuhaiTracker::Item.find_or_create_by(user_id: 'hoge', key: @item.key)
					expect(item.valid?).to be_falsey
				}
			end
		end
	end
end

