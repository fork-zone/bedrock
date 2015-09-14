/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// create namespace
if (typeof Mozilla === 'undefined') {
    var Mozilla = {};
}

(function($) {
    'use strict';

    var TPTour = {};
    var _$strings = $('#strings');
    var _$tracker = $('.dubious');
    var _$step2Panel = $('#info-panel');
    var _$dummyContent = $('#dummy-content');
    var _$endContent = $('#end-state');
    var _step1;
    var _step3;
    var _highlightTimeout;

    TPTour.state = 'step1';

    // Used for unit testing purposes only as "document.hidden" is read only.
    TPTour.documentHidden = null;

    TPTour.step1 = function() {
        var buttons = [
            {
              label: _step1.stepText,
              style: 'text',
            },
            {
              callback: TPTour.step2,
              label: _step1.buttonText,
              style: 'primary',
            },
        ];

        var options = {
            closeButtonCallback: TPTour.step4
        };

        Mozilla.UITour.getConfiguration('availableTargets', function(config) {
            if (config.targets && config.targets.indexOf('trackingProtection') !== -1) {
                Mozilla.UITour.showInfo('trackingProtection', _step1.titleText, _step1.panelText, undefined, buttons, options);
            }
        });

        TPTour.state = 'step1';
    };

    TPTour.step2 = function() {
        _$step2Panel.removeClass('hidden');
        _$step2Panel.find('header').focus();
        _$tracker.addClass('fade-out');
        TPTour.state = 'step2';
    };

    TPTour.step3 = function() {
        TPTour.hideStep2Panel();

        var buttons = [
            {
                label: _step3.stepText,
                style: 'text',
            },
            {
                callback: TPTour.step4,
                label: _step3.buttonText,
                style: 'primary',
            },
        ];

        var options = {
            closeButtonCallback: TPTour.step4
        };

        Mozilla.UITour.showMenu('controlCenter', function() {
            Mozilla.UITour.getConfiguration('availableTargets', function(config) {
                if (config.targets.indexOf('controlCenter-trackingUnblock') !== -1) {
                    Mozilla.UITour.showInfo('controlCenter-trackingUnblock', _step3.titleText, _step3.panelText, undefined, buttons, options);
                    // fade out content if user has landed on step 3 after page reload.
                    _$tracker.addClass('fade-out');
                } else if (config.targets.indexOf('controlCenter-trackingBlock') !== -1) {
                    Mozilla.UITour.showInfo('controlCenter-trackingBlock', _step3.titleText, _step3.panelTextAlt, undefined, buttons, options);
                }
            });
        });

        TPTour.replaceURLState('3');
        TPTour.state = 'step3';
    };

    TPTour.step4 = function() {
        TPTour.hidePanels();
        _$dummyContent.one('animationend', TPTour.showEndState);
        _$dummyContent.addClass('fade-out');
        TPTour.state = 'step4';
    };

    TPTour.showEndState = function() {
        _$dummyContent.addClass('hidden');
        _$endContent.removeClass('hidden');
        TPTour.replaceURLState('done');
    };

    TPTour.hideStep2Panel = function() {
        _$step2Panel.addClass('hidden');
    };

    TPTour._trans = function(stringId) {
        return _$strings.data(stringId);
    };

    /*
     * Strips HTML from string to make sure markup
     * does not get injected in any UITour door-hangers.
     * @param stringId (data attribute string)
     */
    TPTour._getText = function(stringId) {
        return $('<div/>').html(TPTour._trans(stringId)).text();
    };

    TPTour.openPrivacyPrefs = function() {
        Mozilla.UITour.openPreferences('privacy');
    };

    TPTour.handlePrefsLinkClick = function(e) {
        e.preventDefault();
        TPTour.openPrivacyPrefs();
    };

    TPTour.bindEvents = function() {
        $('.prefs-link > a').on('click.tp-tour', TPTour.handlePrefsLinkClick);
        $('#info-panel footer > button').on('click.tp-tour', TPTour.step3);
        $('#info-panel header > button').on('click.tp-tour', TPTour.step4);
        $(document).on('visibilitychange.tp-tour', TPTour.handleVisibilityChange);
        $('#reload-btn').on('click.tp-tour', TPTour.restartTour);
    };

    TPTour.handleVisibilityChange = function() {
        clearTimeout(_highlightTimeout);
        if (TPTour.documentHidden || document.hidden) {
            TPTour.hidePanels();
        } else {
            _highlightTimeout = setTimeout(TPTour.showTourStep, 300);
        }
    };

    TPTour.showTourStep = function() {
        switch(TPTour.state) {
        case 'step1':
            TPTour.step1();
            break;
        case 'step2':
            TPTour.step2();
            break;
        case 'step3':
            TPTour.step3();
            break;
        }
    };

    TPTour.getStep1Strings = function() {
        return {
            titleText: TPTour._getText('panel1Title'),
            panelText: TPTour._getText('panel1Text'),
            stepText: TPTour._getText('panel1Step'),
            buttonText: TPTour._getText('panel1Button')
        };
    };

    TPTour.getStep3Strings = function() {
        return {
            titleText: TPTour._getText('panel3Title'),
            panelText: TPTour._getText('panel3Text'),
            panelTextAlt: TPTour._getText('panel3TextAlt'),
            stepText: TPTour._getText('panel3Step'),
            buttonText: TPTour._getText('panel3Button')
        };
    };

    TPTour.getStrings = function() {
        _step1 = TPTour.getStep1Strings();
        _step3 = TPTour.getStep3Strings();
    };

    TPTour.hidePanels = function() {
        Mozilla.UITour.hideInfo();
        Mozilla.UITour.hideMenu('controlCenter');
        TPTour.hideStep2Panel();
    };

    TPTour.resetPageState = function() {
        _$tracker.removeClass('fade-out');
        _$endContent.addClass('hidden');
        _$dummyContent.removeClass('fade-out').addClass('fade-in');
        // show the content last
        _$dummyContent.removeClass('hidden');
    };

    TPTour.restartTour = function() {
        TPTour.resetPageState();
        TPTour.hideStep2Panel();
        TPTour.state = 'step1';
        TPTour.showTourStep();
    };

    /**
     * Gets the value for a given URL parameter name.
     * @param {string} name - URL parameter name.
     * @param {string} paramString - optional value used for testing.
     * @returns value for the given parameter or 'none'.
     */
    TPTour.getParameterByName = function(name, paramString) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var params = paramString || location.search;
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(params);
        return results === null ? 'none' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    /*
     * Sets 'step' URL param using replaceState
     * @param {currentValue} string to be replaced.
     * @param {newValue} string for new value.
     * @param {url} optional string for testing pruposes.
    */
    TPTour.replaceURLState = function(newValue, url) {
        var href = url !== undefined ? url : window.location.href;
        var currentValue = TPTour.getParameterByName('step');
        var currentParam;
        var delimiter;

        if (!newValue || newValue === currentValue) {
            return;
        }

        newValue = encodeURIComponent(newValue);

        if (href.indexOf('step=') !== -1) {
            currentParam = 'step=' + currentValue;
            href = href.replace(currentParam, 'step=' + newValue);
        } else {
            delimiter = href.indexOf('?') !== -1 ? '&' : '?';
            href = href + delimiter + 'step=' + newValue;
        }

        window.history.replaceState({}, '', href);
    };

    TPTour.init = function() {
        TPTour.getStrings();
        TPTour.bindEvents();

        // TODO - Once Bug 988151 is fixed we can poll for target visibility instead of use a timeout.
        if (TPTour.getParameterByName('step') === '3') {
            setTimeout(TPTour.step3, 500);
        } else {
            setTimeout(TPTour.step1, 500);
        }

    };

    window.Mozilla.TPTour = TPTour;

})(window.jQuery);