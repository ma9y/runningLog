import 'dotenv/config'

export default function (eleventyConfig) {

    eleventyConfig.addPassthroughCopy("views/assets/img");
    eleventyConfig.addPassthroughCopy("views/assets/js");

    // FILTERS
    eleventyConfig.addFilter("floor", function (value) {
        return Math.floor(value);
    });

    eleventyConfig.addFilter("padStart", function (value, length, padChar = "0") {
        return String(value).padStart(length, padChar);
    });

    // (optional) existing date filter
    eleventyConfig.addFilter("date", (value, format = "yyyy-MM-dd") => {
        return new Date(value).toLocaleDateString("cs-CZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    });

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