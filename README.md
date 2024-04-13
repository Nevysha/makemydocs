# MakeMyDocs

Generate documentation with mkdocs from a list of repositories.

## Getting started

### Prerequisites

python >= 3.10

```bash
pip install mkdocs
```

### Configuration

Create a makemydocs.config.js file in the root of the project.

```javascript
const config = {
    //Name of the site
    siteName: "Technical Documentation",
    
    //List of repositories
    repositories: [
        {
            //url of the repository
            "url": "https://github.com/<organization>/<repository>.git",
            //if the repository needs a token
            "needsToken": true,
        },
        {
            "url": "https://github.com/<organization>/<repository>.git",
            "needsToken": true,
            
            //categories for the repository
            // those will trigger the creation of a category in the mkdocs.yml
            "categories": [
                {
                    "name": "Components", // name of the category
                    "path": "lib/components", // corresponding path in the repository
                },
            ],

            //nameMapping specific for repo
            //can be an object or a function
            "nameMapping": [
                {"README-BestPratices.md": "Best Practices"},
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
```

## How to

### Serve mkdocs on windows
```bash
py C:\users\nevysha\appdata\roaming\python\python310\site-packages\mkdocs\__main__.py serve
```

### Build mkdocs on windows
```bash
py C:\users\nevysha\appdata\roaming\python\python310\site-packages\mkdocs\__main__.py build
```