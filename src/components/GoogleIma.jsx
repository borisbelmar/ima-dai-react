import { useCallback, useEffect, useRef } from "react";

const GoogleIma = window.google.ima

function GooleIma() {
  const adContainer = useRef(null)
  const videoElement = useRef(null)
  const adsLoaded = useRef(false)
  const adsLoader = useRef(null)
  const adsManager = useRef(null)
  const adDisplayContainer = useRef(null)
  const playButton = useRef(null)

  const onContentPauseRequested = useCallback(() => {
    videoElement.current.pause();
  }, [])
  
  const onContentResumeRequested = useCallback(() => {
    videoElement.current.play();
  }, [])

  const onAdLoaded = useCallback((adEvent) => {
    var ad = adEvent.getAd();
    if (!ad.isLinear()) {
      videoElement.current.play();
    }
  }, [])
  

  const loadAds = useCallback((e) => {
    // Prevent this function from running on if there are already ads loaded
    if(adsLoaded.current) {
      return;
    }
    adsLoaded.current = true;

    // Prevent triggering immediate playback when ads are loading
    e.preventDefault();

    console.log("loading ads");

    // Initialize the container. Must be done via a user action on mobile devices.
    videoElement.current.load();
    adDisplayContainer.current.initialize();

    const width = videoElement.current.clientWidth;
    const height = videoElement.current.clientHeight;
    try {
      adsManager.current.init(width, height, GoogleIma.ViewMode.NORMAL);
      adsManager.current.start();
    } catch (adError) {
      // Play the video without ads, if an error occurs
      console.log("AdsManager could not be started");
      videoElement.current.play();
    }
  }, [])

  const onAdError = useCallback((adErrorEvent) => {
    // Handle the error logging.
    console.log(adErrorEvent.getError());
    if(adsManager.current) {
      adsManager.current.destroy();
    }
  }, [])

  const onAdsManagerLoaded = useCallback((adsManagerLoadedEvent) => {
    // Instantiate the AdsManager from the adsLoader response and pass it the video element
    adsManager.current = adsManagerLoadedEvent.getAdsManager(videoElement.current);
    adsManager.current.addEventListener(GoogleIma.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.current.addEventListener(GoogleIma.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.current.addEventListener(GoogleIma.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    adsManager.current.addEventListener(GoogleIma.AdEvent.Type.LOADED, onAdLoaded);
  }, [onAdLoaded, onContentPauseRequested, onContentResumeRequested, onAdError])

  const adContainerClick = useCallback(() => {
    if(videoElement.current.paused) {
      videoElement.current.play();
    } else {
      videoElement.current.pause();
    }
  }, [])

  const initializeIMA = useCallback(() => {
    adContainer.current.addEventListener('click', adContainerClick);

    adDisplayContainer.current = new GoogleIma.AdDisplayContainer(adContainer.current, videoElement.current);
    adsLoader.current = new GoogleIma.AdsLoader(adDisplayContainer.current);

    adsLoader.current.addEventListener(
      GoogleIma.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false);
    adsLoader.current.addEventListener(
      GoogleIma.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false);

    // Let the AdsLoader know when the video has ended
    videoElement.current.addEventListener('ended', function() {
      adsLoader.current.contentComplete();
    });

    const adsRequest = new GoogleIma.AdsRequest();
    adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
        'sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&' +
        'impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&' +
        'cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';

    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = videoElement.current.clientWidth;
    adsRequest.linearAdSlotHeight = videoElement.current.clientHeight;
    adsRequest.nonLinearAdSlotWidth = videoElement.current.clientWidth;
    adsRequest.nonLinearAdSlotHeight = videoElement.current.clientHeight / 3;

    // Pass the request to the adsLoader to request ads
    adsLoader.current.requestAds(adsRequest);
  }, [onAdsManagerLoaded, adContainerClick, onAdError])

  useEffect(() => {
    initializeIMA();
    videoElement.current.addEventListener('play', function(event) {
      loadAds(event);
    });
    playButton.current.addEventListener('click', function() {
      videoElement.current.play();
    });
    window.addEventListener('resize', function() {
      console.log("window resized");
      if(adsManager.current) {
        var width = videoElement.current.clientWidth;
        var height = videoElement.current.clientHeight;
        adsManager.current.resize(width, height, GoogleIma.ViewMode.NORMAL);
      }
    });
  }, [initializeIMA, loadAds])

  return (
    <div id="page-content">
      <div id="video-container">
        <video id="video-element" ref={videoElement}>
          <source src="https://storage.googleapis.com/interactive-media-ads/media/android.mp4"></source>
          <source src="https://storage.googleapis.com/interactive-media-ads/media/android.webm"></source>
        </video>
        <div id="ad-container" ref={adContainer} />
      </div>
      <button id="play-button" ref={playButton}>Play</button>
    </div>
  );
}

export default GooleIma;
