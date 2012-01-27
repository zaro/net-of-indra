require 'json'

class AppConfig
	@@config = nil
	@@testFirstNames = ["Delicious", "Sweet", "Honey", "Juicy", "Yummy",
											"Tasty", "Lush", "Savory", "Mouthwatering", "Dainty"]
	@@testLastNames  = ["Apple", "Banana", "Strawberry", "Mellon",
										 	"Pear", "Orange", "Ananas", "Mango",
										 	"Papaya", "Cherry", "Fig", "Pomegranate",
										 	"Peach", "Kiwi", "Grapes", "Grapefruit",
										 	"Lemon", "Apricot", "Plum", "Pomelo"]
	@@testUsersFile  = "test_users.json"										 	
	def self.getConfig()
 	  unless @@config
 	  	app_config = ENV['APP_CONFIG'] || '../app_config.json'
			@@config=JSON.parse(File.read(app_config))
			@@config['testFirstNames'] ||= @@testFirstNames
			@@config['testLastNames'] ||= @@testLastNames
			@@config['testUsersFile'] ||= @@testUsersFile
		end
		return @@config
	end
end


