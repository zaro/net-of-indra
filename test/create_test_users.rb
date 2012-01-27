#!/usr/bin/env ruby

require './util.rb'
require 'fb_graph'

cfg = AppConfig.getConfig
app = FbGraph::Application.new(cfg['FB_APP_ID'], :secret => cfg['FB_APP_SECRET'])
createdUsers = []
for firstName in cfg['testFirstNames'] do
	for lastName in cfg['testLastNames'] do
		name = "#{firstName} #{lastName}"
		user =  app.test_user!(:name => name,
																	:installed => true,
																	:permissions => 'read_friendlists,publish_stream,user_photos')
		createdUsers << { :id => user.identifier, :password => user.password, :endpoint => user.endpoint,
											:email => user.email }
	end
end
begin
	testUsers = JSON.parse(File.read(cfg['testUsersFile']))
rescue Errno::ENOENT => e
	testUsers = []
end

File.open(cfg['testUsersFile'], 'w') {|f| f.write(JSON.pretty_generate(testUsers + createdUsers)) }
