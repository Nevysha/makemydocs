const config = {
    siteName: "Technical Documentation",
    repositories: [
        {
            "url": "https://github.com/<organization>/<repository>.git",
            "needsToken": true,
        },
        {
            "url": "https://github.com/<organization>/<repository>.git",
            "needsToken": true,
            "categories": [
                {
                    "name": "Components", // name of the category
                    "path": "lib/components", // corresponding path in the repository
                },
            ],

            //nameMapping specific for repo
            //can be an object or a function
            "nameMapping": [
                {"SPECIFIC_FILE_NAME.md": "Pretty Name"},
            ]
        },
        {
            "url": "https://github.com/<organization>/<repository>.git",
            needsToken: true,
        }
    ],

    //nameMapping for all repos
    //can be an object or a function
    nameMapping: [
        (fileName) => fileName.replace('README-', '')
    ]
}

export default config;