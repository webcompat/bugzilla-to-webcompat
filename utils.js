"use strict";

const IOS_PLATFORM = "iOS";
const ANDROID_PLATFORM = "Mobile";
const iOSFixedFirefoxVersion = "29.0";

const DESKTOP_NIGHTLY_KEY = "FIREFOX_NIGHTLY";
const MOBILE_NIGHTLY_KEY = "nightly_version";

const PRODUCT_ENDPOINT = "https://product-details.mozilla.org/1.0/";
const DESKTOP_ENDPOINT = `${PRODUCT_ENDPOINT}firefox_versions.json`;
const MOBILE_ENDPOINT = `${PRODUCT_ENDPOINT}mobile_versions.json`;

const WINDOWS = "Windows 10";
const iOS = "iOS 14.1";
const macOS = "Mac OS X 10.15";

const OS_REPLACE = {
  All: WINDOWS,
  Windows: WINDOWS,
  macOS: macOS,
  iOS: iOS
};

function getOS(os) {
  if (!os) {
    return WINDOWS;
  }

  if (os in OS_REPLACE) {
    return OS_REPLACE[os];
  }

  return os;
}

function getPlatform(os) {
  if (os.includes("Android")) return ANDROID_PLATFORM;
  else if (os.includes("iOS")) return IOS_PLATFORM;

  return "";
}

/**
 * Returns a string containing version in NN.N format
 *
 * @param n
 * @param os
 * @returns {string}
 */

function getVersionNum(n, os) {
  if (os.includes("iOS")) return iOSFixedFirefoxVersion;
  return parseFloat(n).toFixed(1);
}

function combinePlatformVersion(platform, version) {
  return `Firefox ${platform ? platform + " " : ""}${version}`;
}

async function getNightlyVersion(platform, os) {
  const endpoint =
    platform === "Mobile" || platform === "iOS"
      ? MOBILE_ENDPOINT
      : DESKTOP_ENDPOINT;

  return await fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      const key = !platform ? DESKTOP_NIGHTLY_KEY : MOBILE_NIGHTLY_KEY;
      return combinePlatformVersion(platform, getVersionNum(data[key], os));
    })
    .catch(error => error);
}

/**
 * If version is provided, returns platfor & version combination
 * Otherwise makes a request to retrieve latest Nightly version
 *
 * @param version
 * @param os
 */

async function getBrowser(version = "", os = "") {
  const matches = version.match(/\d+/g);
  const platform = getPlatform(os);

  if (matches && matches.length) {
    return new Promise(function(resolve) {
      resolve(combinePlatformVersion(platform, getVersionNum(matches[0], os)));
    });
  }

  return getNightlyVersion(platform, os);
}

function getSteps(comments = [], fallbackMessage) {
  if (comments.length && comments[0].text) {
    return comments[0].text;
  }

  return fallbackMessage;
}

const utils = {
  getOS,
  getBrowser,
  getSteps
};

module.exports = utils;
