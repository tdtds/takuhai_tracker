# 宅配トラッカー

宅配便の配送状況を、PushbulletやIFTTTを通じて知らせてくれるシンプルなWebサービス。
対応サービスは以下の6つ:

* ヤマト運輸
* 佐川急便
* 日本郵便
* TMG (Amazonの荷物のみ)
* UPS
* FedEx (国外の移動のみ)

## Installation

Getting code:

    $ git clone https://github.com/tdtds/takuhai_tracker.git
	 $ cd takuhai_tracker

And setting up and execute:

	 $ bundle install
	 $ bundle exec puma -C config/puma.rb

Or deploy to Heroku:

    $ heroku apps:create YOUR_APP_NAME
	 $ heroku addons:add mongolab -a YOUR_APP_NAME
    $ git push "git@heroku.com:YOUR_APP_NAME.git" master:master

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/tdtds/takuhai_tracker.


## License

The gem is available as open source under the terms of the GPL3.

