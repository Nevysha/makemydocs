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

- `siteName` : the name of the site.
- `repositories` : list of repositories to include in the documentation.
    - `url` : url of the repository.
    - `needsToken` : if the repository needs a token.
    - `categories` : list of categories for the repository.
        - `name` : name of the category.
        - `path` : corresponding path in the repository.
    - `nameMapping` : list of name mappings for the repository. Can be an object or a function.
        - `SPECIFIC_FILE_NAME.md` : name of the file in the repository.
        - `Pretty Name` : name of the link in the documentation.
        - `(fileName) => string` : function to transform the file name.


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
```

If needed, create a makemydocs.env.json file in the root of the project to set your github token.
```json
{
  "token": "your_token_here"
}
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