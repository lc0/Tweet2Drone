DRONE = DRONE || {}

DRONE.Translator = do ->

	commandMap =
		takeoff : ->
			DRONE.API.takeoff()
		land : ->
			DRONE.API.land()
		


	# private
	processMessage = (msg) ->

		commandMap[msg].call()


	notSupportedError = ->
		return console.log("#{msg} is not supported, try one of these commands [#{command for command, fn of commandMap}]")



	# public
	translate : (msg) ->

		# do sanitizing with the message

		unless commandMap[msg]?
			notSupportedError()
		
		

		processMessage(msg)






