module.exports = {
  cleanUrl: function cleanUrl(url) {
    //check if url is a string with a /
    if (!url) {
      return false;
    }

    if (!url.includes("/")) {
      url = url + "/";
    }

    url = url.replace("http://", "");
    url = url.replace("https://", "");

    let preSlash = url.split("/")[0];
    let postSlash = url.split("/")[1];

    preSlash = preSlash.toLowerCase();

    const cleanedUrl = `${preSlash}/${postSlash}`;

    const pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    );
    if (!pattern.test(cleanedUrl)) {
      return false;
    }

    return cleanedUrl;
  },
};
