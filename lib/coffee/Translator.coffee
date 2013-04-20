DRONE = DRONE || {}

DRONE.Translator = do ->

	commandMap =
		takeoff : ->
			DRONE.API.takeOff()
		land : ->
			DRONE.API.land()



	# private
	processMessage = (msg) ->

		commandMap[msg].call()


	notSupportedError = (msg) ->
		return console.log("#{msg} is not supported, try one of these commands [#{command for command, fn of commandMap}]")



	# public
	translate : (opts) ->

		# sanitize message
		msg = opts.msg

		unless commandMap[msg]?
			return opts.error?(notSupportedError(msg))
			
		processMessage(msg)
		opts.success?()






