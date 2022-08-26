const path = require("path");
const express = require("express");
const router = express.Router();
const pg = require("pg");

// client side static assets
router.get("/", (_, res) => res.sendFile(path.join(__dirname, "./index.html")));
router.get("/client.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./client.js"))
);
router.get("/detail-client.js", (_, res) =>
  res.sendFile(path.join(__dirname, "./detail-client.js"))
);
router.get("/style.css", (_, res) =>
  res.sendFile(path.join(__dirname, "../style.css"))
);
router.get("/detail", (_, res) =>
  res.sendFile(path.join(__dirname, "./detail.html"))
);

/**
 * Student code starts here
 */

// connect to postgres
const pool = new pg.Pool({
  user: 'postgres',
  database: 'recipeguru',
  host: 'localhost',
  port: 5432,
  password: 'lol'
})

router.get("/search", async function (req, res) {
  console.log("search recipes");

  const { rows } = await pool.query(`SELECT DISTINCT ON (recipe_id)
  r.recipe_id AS recipe_id, 
  r.title AS title, 
  COALESCE(rp.url, 'default.jpg') AS url
  FROM recipes r 
  LEFT JOIN recipes_photos rp
  ON r.recipe_id = rp.recipe_id`)

  res.json({ rows }).end();

  // return recipe_id, title, and the first photo as url
  //
  // for recipes without photos, return url as default.jpg

  // res.status(501).json({ status: "not implemented", rows: [] });
});

router.get("/get", async (req, res) => {
  const recipeId = req.query.id ? +req.query.id : 1;
  console.log("recipe get", recipeId);

  // return all ingredient rows as ingredients
  //    name the ingredient image `ingredient_image`
  //    name the ingredient type `ingredient_type`
  //    name the ingredient title `ingredient_title`
   const ingredientsPromise = pool.query (`
   SELECT 
      i.image AS ingredient_image,
      i.title AS ingredient_title,
      i.type AS ingredient_type
   FROM
      recipe_ingredients ri
    
   INNER JOIN 
      ingredients i
   ON 
      i.id = ri.ingredient_id
   WHERE 
      ri.recipe_id=$1;
   `, 
      [recipeId]
    )
  // return all photo rows as photos
  //    return the title, body, and url (named the same)
   const photoPromise = pool.query (`
   SELECT 
      r.title AS title,
      r.body AS body,
      COALESCE(rp.url, 'default.jpg') AS url
   FROM 
      recipes_photos rp
   INNER JOIN
      recipes r
    ON
      r.recipe_id = rp.recipe_id
    WHERE 
      rp.recipe_id=$1;
    `, 
      [recipeId]
    )
  // return the title as title
  // return the body as body
  // if no row[0] has no photo, return it as default.jpg
  const [ingredientResponse, photoResponse] = await Promise.all([
    ingredientsPromise,
    photoPromise
  ])

  const ingredientRow = ingredientResponse.rows;
  const photoRows = photoResponse.rows;
  
  res.json({ 
    ingredients: ingredientRow,
    title: photoRows[0].title,
    body: photoRows[0].body,
    photos: photoRows.map((photo) => photo.url),
   }).end();

  // res.status(501).json({ status: "not implemented" });
});
/**
 * Student code ends here
 */

module.exports = router;
