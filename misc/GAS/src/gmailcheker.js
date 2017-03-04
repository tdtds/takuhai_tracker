function gmailchecker(){

	var ID = "YOUR TAKUTORA ID"

	var mailThreads = GmailApp.getInboxThreads(0,100);
	for(var n in mailThreads){
		var mailThread = mailThreads[n];
		var mails = mailThread.getMessages();
		for(var m in mails){
			var mail = mails[m]
			var from = mail.getFrom()
			if (from.indexOf("order-update@amazon.co.jp","0") != -1 && !mail.isStarred()){
				mail.markUnread();
				var message = mails[m].getPlainBody();
				var regexp1  = /お問い合わせ伝票番号は(:?.*)です。/gi;
				var regexp2  = /配達受付番号（伝票番号）：(:?\d+)/gi;
				var match1 = regexp1.exec(message);
				var match2 = regexp2.exec(message);
				var no;
				if (match1){
					no = match1[1]
				}else if(match2){
					no = match2[1]
				}
				if(no){
					var url = 'http://takuhai-tracker.herokuapp.com/' + ID + '/' + no
					var options = {
						'followRedirects' : true
					};
					var res = UrlFetchApp.fetch(url,options)
					mail.star();
				}
			}
		}
	}
}
