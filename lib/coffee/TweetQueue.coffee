DRONE = DRONE || {}

DRONE.TweetQueue = do ->

	queue = []
	running = false
	speed = 3000

	cancel = ->
		if running
			clearInterval(running)
			running = false


	main = ->
	 	Notifications.notify('success', 'Started!');
		unless running
			running = true
			running = setInterval ->
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

	init : ->
		# bind handlers
		$('#start').bind('click', main)
		$('#cancel').bind('click', cancel)

	push : (item) ->
		queue.push(item)
