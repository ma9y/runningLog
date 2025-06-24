export default function (eleventyConfig) {
    
    eleventyConfig.addPassthroughCopy("views/assets/img");
    eleventyConfig.addPassthroughCopy("views/assets/js");
};

export const config = {

    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk", 

    dir: {
        input: "views",
        layouts: "_layouts",
        output: "dist"
    }
};