#!/usr/bin/env ruby

require './util.rb'
require './thread-pool.rb'
require 'fb_graph'
require 'json'

cfg = AppConfig.getConfig
app = FbGraph::Application.new(cfg['FB_APP_ID'], :secret => cfg['FB_APP_SECRET'])

deleted = {}
users = app.test_users.each do |u|
	u.destroy
	deleted[u.identifier] = true
end

begin
	testUsers = JSON.parse(File.read(cfg['testUsersFile']))
rescue Errno::ENOENT => e
	exit
end
newTestUsers = []
testUsers.each do |u|
	newTestUsers << u unless deleted[u.id]
end

File.open(cfg['testUsersFile'], 'w') {|f| f.write(JSON.pretty_generate(newTestUsers)) }
