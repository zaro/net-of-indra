#!/usr/bin/env ruby

require './util.rb'
require 'fb_graph'
require 'json'

cfg = AppConfig.getConfig
app = FbGraph::Application.new(cfg['FB_APP_ID'], :secret => cfg['FB_APP_SECRET'])

if ARGV[0] == 'count' then
	puts app.test_users({ :limit => 999999 , :offset => 0 }).length
	exit
end

offset = ARGV[0] || 0;
limit = ARGV[1] || 999999;

users = app.test_users({ :limit => limit , :offset => offset })
userData = users.map do |u| 
	{
		:id => u.identifier,
		:access_token => u.access_token,
		:login_url => u.login_url
	}
end
puts JSON.pretty_generate(userData)
