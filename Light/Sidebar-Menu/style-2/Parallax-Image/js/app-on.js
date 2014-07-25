/*global $, jQuery, document, window*/
/* ==========================================================================
Document Ready Function
========================================================================== */
jQuery(document).ready(function () {

    'use strict';

    var onMobile, slider, slider2, readyHeight, windowWidth, formInput, sformInput;


    /* ==========================================================================
    on mobile?
    ========================================================================== */
	onMobile = false;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) { onMobile = true; }

	if (onMobile === true) {
        $('#home-section').css({background: 'url(images/background/1-1600x900.jpg) center top'});
        $('#home-blog-section').css({background: 'url(images/background/1-1600x900.jpg) center top'});
    } else {
        /* ==========================================================================
        Parallax
        ========================================================================== */
        jQuery('#home-section').parallax("50%", 0.3);
        jQuery('#home-blog-section').parallax("50%", 0.3);
    }


    /* ==========================================================================
    ScrollTo
    ========================================================================== */
    $('a.scrollto').click(function (event) {
        $('html, body').scrollTo(this.hash, this.hash, {gap: {y: 2}, animation:  {easing: 'easeInOutCubic', duration: 800}});
        event.preventDefault();
	});


    /* ==========================================================================
    Feature Tabs
    ========================================================================== */
    slider = $("div#WorksTabs").sliderTabs({
        autoplay: 10000,
        panelArrows: true,
        position: 'top',
        tabArrows: false,
        defaultTab: 2
    });


    /* ==========================================================================
    Member Tabs
    ========================================================================== */
    slider2 = $("div#TeamTabs").sliderTabs({
        autoplay: 10000,
        panelArrows: false,
        tabArrows: false,
        position: 'top',
        indicators: true
    });


    /* ==========================================================================
    Portfolio
    ========================================================================== */
    $(".owl-portfolio").owlCarousel({
        items : 4,
        itemsDesktop : [1000, 2],
        itemsDesktopSmall : [768, 1],
        itemsTablet: [568, 1],
        lazyLoad: true,
        autoPlay: true,
        pagination : true,
        stopOnHover: true,
        navigation : false
    });


    /* ==========================================================================
    Home
    ========================================================================== */
    $(".owl-home").owlCarousel({
        items : 1,
        itemsDesktop : [1000, 1],
        itemsDesktopSmall : [768, 1],
        itemsTablet: [568, 1],
        lazyLoad: true,
        autoPlay: true,
        pagination : true,
        stopOnHover: true,
        navigation : false
    });


    /* ==========================================================================
    Fancy Box
    ========================================================================== */
    $(".fancybox").fancybox({
        helpers : {
            overlay : {
                speedOut : 0,
                locked: false
            }
        }
    });


    /* ==========================================================================
    Magnify
    ========================================================================== */
    $("#magnify-image").mlens({
		imgSrc: $("#magnify-image").attr("data-big"),
		lensShape: "circle",
		lensSize: 180,
		borderSize: 4,
		borderColor: "#000000",
		borderRadius: 0
	});


    /* ==========================================================================
    Feature Image Height
    ========================================================================== */
    windowWidth = $(window).width();
    if (windowWidth >= 991) {
        $('#ready-section .feature-image').css({minHeight: '480px'});
        readyHeight = $('.col-md-6.readyHeights').height() + 40;
        $('#ready-section .feature-image').css({height: readyHeight});
    } else {
        $('#ready-section .feature-image').css({height: '480px'});
    }


    /* ==========================================================================
    FAQ Tabs
    ========================================================================== */
    $(function () {
        $('.faq-tabs > ul li:first-child a').addClass('active');
        $('#faq1Containt').siblings().hide();
        $('.faq-tabs > ul li a').click(function (event) {
            var faq = this.hash;
            $('.faq-tabs > ul li a').removeClass('active');
            $(this).addClass('active');
            $(faq + 'Containt').siblings().slideUp(0);
            $(faq + 'Containt').slideDown(0);
            event.preventDefault();
        });
    });


    /* ==========================================================================
    Clients
    ========================================================================== */
    $(".owl-clients").owlCarousel({
        items : 1,
        itemsDesktop : [1000, 1],
        itemsDesktopSmall : [768, 1],
        itemsTablet: [568, 1],
        lazyLoad: true,
        autoPlay: true,
        pagination : false,
        stopOnHover: true,
        navigation : false
    });

    $("a.clients-next").click(function () {
        $(".owl-clients").trigger("owl.next");
    });
    $("a.clients-prev").click(function () {
        $(".owl-clients").trigger("owl.prev");
    });


    /* ==========================================================================
    FORM Validation
    ========================================================================== */
    $('form#form').submit(function () {
        $('form#form .error').remove();
        $('form#form .success').remove();
        var hasError = false;
        $('.requiredField').each(function () {
            if (jQuery.trim($(this).val()) === '') {
                hasError = true;
            } else if ($(this).hasClass('email')) {
                var emailReg = /^([\w-\.]+@([\w]+\.)+[\w]{2,4})?$/;
                if (!emailReg.test(jQuery.trim($(this).val()))) {
                    hasError = true;
                }
            }
        });
        if (hasError === true) {
            $('form#form').append('<div class="success"><div class="alert alert-nesto"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>Oops. You missed some required fields.</p></div></div>');
        }
        if (!hasError) {
            formInput = $(this).serialize();
            $.post($(this).attr('action'), formInput, function (data) {
                $('form#form').append('<div class="success"><div class="alert alert-nesto"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>Thanks! Your email was successfully sent. We will contact you asap.</p></div></div>');
            });
            $('.requiredField').val('');
        }
        return false;
    });
    $('form#form input').focus(function () {
        $('form#form .error').remove();
        $('form#form .success').remove();
    });
    $('form#form textarea').focus(function () {
        $('form#form .error').remove();
        $('form#form .success').remove();
    });


    /* ==========================================================================
    Subscribe
    ========================================================================== */
    $('form#sform').submit(function () {
        $('form#sform .serror').remove();
        $('form#sform .success').remove();
        var shasError = false;
        $('.srequiredField').each(function () {
            if (jQuery.trim($(this).val()) === '') {
                shasError = true;
            } else if ($(this).hasClass('email')) {
                var emailReg = /^([\w-\.]+@([\w]+\.)+[\w]{2,4})?$/;
                if (!emailReg.test(jQuery.trim($(this).val()))) {
                    shasError = true;
                }
            }
        });
        if (shasError === true) {
            $('form#sform').append('<div class="success"><div class="alert alert-nesto"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>Please enter a valid email address.</p></div></div>');
        }
        if (!shasError) {
            sformInput = $(this).serialize();
            $.post($(this).attr('action'), sformInput, function (data) {
                $('form#sform').append('<div class="success"><div class="alert alert-nesto"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>You have successfully subscribed to our newsletter.</p></div></div>');
            });
            $('.srequiredField').val('');
        }
        return false;
    });
    $('form#sform input').focus(function () {
        $('form#sform .serror').remove();
        $('form#sform .success').remove();
    });


    /* ==========================================================================
    MoreApps Slider
    ========================================================================== */
    $('#owl-apps').owlCarousel({
        items : 6,
        itemsDesktop : [1000, 5],
        itemsDesktopSmall : [768, 2],
        itemsTablet: [520, 2],
        itemsMobile: [320, 1],
        lazyLoad : true,
        pagination: true,
        autoPlay: 5000
    });


    /* ==========================================================================
    SideBar Menu
    ========================================================================== */
    $('a.sidebar-btn').on('click', function (e) {
        e.preventDefault();
        $('#sidebar-wrapper').toggleClass('openclose');
        $('#sidebar-overlayer').toggleClass('openclose');
    });
    $('#sidebar-overlayer').on('click', function (e) {
        e.preventDefault();
        $('#sidebar-wrapper').removeClass('openclose');
        $('#sidebar-overlayer').toggleClass('openclose');
    });

    $('#sidebar-container a.scrollto').click(function (event) {
        $('html, body').scrollTo(this.hash, this.hash, {gap: {y: 2}, animation:  {easing: 'easeInOutCubic', duration: 800}});
        event.preventDefault();
        $('#sidebar-wrapper').removeClass('openclose');
        $('#sidebar-overlayer').removeClass('openclose');
	});

    $('#works-section .ui-slider-tab-content').css({width: $('#works-section .col-md-12').width()});
    $('.ui-slider-tabs-content-container').css({height: $('.ui-slider-tab-content.selected').height()});


    /* ==========================================================================
    FitVids
    ========================================================================== */
    $('.videos').fitVids();


    /* ==========================================================================
    Flickr Feed
    ========================================================================== */
    $('#flickr-feed').jflickrfeed({
        limit: 6,
        qstrings: {
            id: '25461271@N07'
        },
        itemTemplate: '<li>' + '<a href="{{image_b}}" class="fancybox" data-fancybox-group="gall1" title="{{title}}"><img src="{{image_s}}" alt="{{title}}" /></a>' + '</li>'
    });


}); // JavaScript Document




/* ==========================================================================
Window Resize
========================================================================== */
$(window).resize(function () {

    'use strict';

    var magnifyWidth, windowWidth, readyHeight;

    /* ==========================================================================
    Magnify Width
    ========================================================================== */
    magnifyWidth = $('#magnify-container').width();
    $('#mlens_wrapper_0').css({width: magnifyWidth});


    /* ==========================================================================
    Feature Image Height
    ========================================================================== */
    windowWidth = $(window).width();
    if (windowWidth >= 991) {
        $('#ready-section .feature-image').css({minHeight: '480px'});
        readyHeight = $('.col-md-6.readyHeights').height() + 40;
        $('#ready-section .feature-image').css({height: readyHeight});
    } else {
        $('#ready-section .feature-image').css({height: '480px'});
    }


});




/* ==========================================================================
Window Load
========================================================================== */
jQuery(window).load(function () {

    'use strict';

    var LoaderDelay, LoaderFadeOutTime;

    /* ==============================================
    Loader
    =============================================== */
    LoaderDelay = 350;
    LoaderFadeOutTime = 800;

    function hideLoader() {
        var loadingLoader = $('#Loader');
        loadingLoader.fadeOut();
    }
    hideLoader();


    $('#works-section .ui-slider-tab-content').css({width: $('#works-section .col-md-12').width()});
    $('.ui-slider-tabs-content-container').css({height: $('.ui-slider-tab-content.selected').height()});


});