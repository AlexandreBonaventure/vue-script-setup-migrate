module.exports = {
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      
      "module": {
        // You can specify "commonjs", "amd", "umd"
        "type": "commonjs",
        "strict": false,
        "strictMode": true,
        "lazy": false,
        "noInterop": false
      }

    }],
  },
}
