DRONE = DRONE || {}

DRONE.TweetQueue = do ->

	queue = []
	running = false
	speed = 3000


	push : (item) ->
		queue.push(item)

	cancel : ->
		if running
			clearInterval(running)


	loop : ->
		unless running

			running = setInterval ->
				oldlength = queue.length
				msg = queue.pop()

				if msg
					opts = 
						msg : msg
						error : ->
							Notifications.droneAction('error', "Error performing #{msg}, not supported" )
						success : ->
							Notifications.droneAction('success', "Performing #{msg}" )



					result = DRONE.Translator.translate(opts)
					
			, 
			speed


