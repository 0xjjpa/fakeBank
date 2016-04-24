
$(function() {

	// get elements to increase speed
	$layout = $('.metro-layout');
	$container = $('.metro-layout .content');

	// this method should be called when you want to switch the layout style - horizontal or vertical
	function changeLayoutMode(isHorizontal) {
		$('.items',$layout).removeAttr('style'); // clean style
		if ( isHorizontal ) {
			$('.items',$layout).css({
				width: $('.items',$layout).outerWidth() // make sure we get the whole width of the items container
			}).isotope({
				itemSelector : '.box',
				layoutMode: 'masonryHorizontal',
				animationEngine : 'css'
			});
		} else {
			$('.items',$layout).css({ width: 'auto' }).isotope({
				itemSelector : '.box',
				layoutMode: 'masonry',
				animationEngine : 'css'
			});
		}
	}
	changeLayoutMode($layout.hasClass('masonryHorizontal')); // init initial state based on the class in the markup

	// hook up events for the controls
	$('.next',$layout).click(function(ev){
		ev.preventDefault();
		$container.stop().animate({scrollLeft: '+='+($('body').innerWidth()/1.8)},400);
	});
	$('.prev',$layout).click(function(ev){
		ev.preventDefault();
		$container.stop().animate({scrollLeft: '-='+($('body').innerWidth()/1.8)},400);
	});
	$('.up',$layout).click(function(ev){
		ev.preventDefault();
		$container.stop().animate({scrollTop: '-='+($('body').innerHeight()/1.8)},400);
	});
	$('.down',$layout).click(function(ev){
		ev.preventDefault();
		$container.stop().animate({scrollTop: '+='+($('body').innerHeight()/1.8)},400);
	});

	// hook up the event for switching layouts
	$('.toggle-view',$layout).click(function(ev){
		ev.preventDefault();
		$layout.toggleClass('horizontal vertical');
		changeLayoutMode($layout.hasClass('horizontal'));
		toggleSlideControls();
	});

	// this function toggles the controls visibility if necessary
	function toggleSlideControls() {
		// check if any overflow is present
		var hasHScrollbar = $container.get(0).scrollWidth > $container.innerWidth();
		var hasVScrollbar = $container.get(0).scrollHeight > $container.innerHeight();
		if (hasHScrollbar)
			$('.prev,.next',$layout).show();
		else
			$('.prev,.next',$layout).hide();
		if (hasVScrollbar)
			$('.up,.down',$layout).show();
		else
			$('.up,.down',$layout).hide();
	};
	toggleSlideControls();

	// respond to mousewheel
	$('.items',$layout).bind('mousewheel', function(ev, delta, deltaX, deltaY) {
		if (delta) {
			ev.preventDefault();
			var isHorizontal = $layout.hasClass('horizontal');
			if (isHorizontal)
				$container.stop().animate({scrollLeft: '-='+($('body').innerWidth()/4*delta)},10);
			else
				$container.stop().animate({scrollTop: '-='+($('body').innerHeight()/4*delta)},10);
			console.log(delta, deltaX, deltaY);
		}
	});

	// make sure we toggle controls when the user resizes window
	var resizeTimer;
	$(window).bind('resize', function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(toggleSlideControls, 100);
	});

	// add draggablre state to scroll area
	$container.dragscrollable( {dragSelector: '.items'} );

})
