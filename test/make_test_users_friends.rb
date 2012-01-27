#!/usr/bin/env ruby

require './util.rb'
require './thread-pool.rb'
require 'fb_graph'

cfg = AppConfig.getConfig
app = FbGraph::Application.new(cfg['FB_APP_ID'], :secret => cfg['FB_APP_SECRET'])
users = app.test_users({ :limit => 999999 , :offset => 0 })
#count = 0

pool = Pool.new(30)
puts "App has test #{users.length} users :)"
for i in 0...users.length do
 	#user1 = users[i]
 	#puts user1.inspect
 	for j in (i+1)...users.length do
 		#user2 = users[j]
		pool.schedule(users[i], users[j]) do |user1, user2|
			puts "Making friends '#{user1.identifier}' to '#{user2.identifier}'"
			3.times do 
				begin
					user1.friend!(user2)
					break
				rescue FbGraph::InvalidRequest => e
					break if e.message.include? 'OAuthException :: (#522) You are already friends with this user'
					break if e.message.include? 'OAuthException :: (#520) There is already a pending friend request to this user'
					puts "EXCEPTIION:" + e.message
					throw e
				rescue HTTPClient::TimeoutError => e
				end
			end
		end
		#count += 1
	end
end
pool.shutdown
