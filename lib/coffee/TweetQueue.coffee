DRONE = DRONE || {}

DRONE.TweetQueue = do ->

	queue = []
	interval = null
	running = false
	speed = 3000

	cancel : ->
		if running
			clearInterval(interval)
			running = false


	main : ->
		unless running
			running = true
			interval = setInterval ->
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
		return

	push : (item) ->
		queue.push(item)
