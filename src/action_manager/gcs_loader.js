"use strict";

const flags = require("../flags");
const Storage = require("@google-cloud/storage");

//
// Command-line arguments
//

flags.addOptionConfig([
  {
    group: "Google Cloud Storage (GCS) Settings"
  },
  {
    names: ["gcs-bucket-name"],
    env: "GCS_BUCKET_NAME",
    type: "string",
    help: "Name of the bucket in Google Cloud Storage in which to find action archives",
    default: "twineai-actions-prod-d37dc540",
  },
  {
    names: ["gcs-credentials-file"],
    env: "GCS_CREDENTIALS_FILE",
    type: "string",
    help: "Path to the GCE service account key file. If empty, the system default will be used.",
    default: "",
  },
]);

//
// Google Cloud Storage Loader
//

class GCSLoader {
  constructor(opts) {
    let gcsConfig = {};
    if (opts.gcs_credentials_file) {
      gcsConfig.keyFilename = opts.gcs_credentials_file;
    }

    this.storage = Storage(gcsConfig);
    this.bucket = this.storage.bucket(opts.gcs_bucket_name);
  }

  loadAction() {
  }
}

module.exports = GCSLoader;
