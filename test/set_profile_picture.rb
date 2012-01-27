#!/usr/bin/env ruby

require 'watir-webdriver'
require 'json'
require './util.rb'
require 'fb_graph'

# get list of users

#userList = JSON.parse(`./list_test_users.rb`)
picDir = ARGV[0] || (raise "Please specify directory with pictures")
offset = ARGV[1] || 0 
userPictures = Dir.entries(picDir).map { |f| picDir + '/' +f }
cfg = AppConfig.getConfig
app = FbGraph::Application.new(cfg['FB_APP_ID'], :secret => cfg['FB_APP_SECRET'])
allUserList = app.test_users({ :limit => 999999 , :offset => 0 })

timeout = 90

pageSize = 5
pageOffset = offset.to_i
picCount = pageOffset
if picCount >= userPictures.length then
	picCount = 0
end

while pageOffset < allUserList.length do
	b = Watir::Browser.new :chrome
	b.goto 'https://www.facebook.com/'
	
	userList = allUserList[(pageOffset)..(pageOffset + pageSize - 1)]
	puts "Processing #{userList.length} at offset #{pageOffset}"
	pageOffset += userList.length
	userList.each do |u|
		#puts u.inspect
		user = {
			:id => u.identifier,
			:access_token => u.access_token,
			:login_url => u.login_url
		}
		#puts user.inspect
		puts "Process user #{user[:id]}"
		puts "  Login URL #{user[:login_url]}"
		#sleep 3
		b.goto user[:login_url]
		sleep 3
		b.goto 'http://www.facebook.com/editprofile.php?sk=picture'
		sleep 3
		noImgUrl = b.image(:id, "profile_pic").src
		b.file_field(:id, "profile_picture_post_file").set(userPictures[picCount])
		picCount += 1
		if picCount >= userPictures.length then
			picCount = 0
		end
		count = 0
		begin
			sleep 1
			count += 1
		end while (count < timeout) && (b.image(:id, "profile_pic").src == noImgUrl)
		if count >= timeout then
			puts "ERROR: Failed  to set picture " + userPictures[picCount]
		end
	end
	b.close
	b = nil
end

#		.clickAndWait('css=a.pvs.plm.profilePictureNuxHighlightLink')

