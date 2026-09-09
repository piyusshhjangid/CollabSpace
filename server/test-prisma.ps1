# 1. Test project summary
curl http://localhost:5000/api/projects/c0dad3ec-0e54-4198-a254-ec5cb7b0e7f8/summary

# 2. Test creating a project
curl -Method POST `
     -Uri http://localhost:5000/api/workspaces/82423d38-d7ac-4f71-9586-86a9632e2d1b/projects `
     -ContentType "application/json" `
     -Body '{"name":"Prisma Test Project","description":"Testing Prisma repository"}'

# 3. Test creating a task
curl -Method POST `
     -Uri http://localhost:5000/api/projects/c0dad3ec-0e54-4198-a254-ec5cb7b0e7f8/tasks `
     -ContentType "application/json" `
     -Body '{"title":"Prisma repository test"}'

# 4. Check all repository files for raw SQL
Select-String -Path src/repositories/*.ts -Pattern "pool.query"

# 5. Check that repositories use Prisma
Select-String -Path src/repositories/*.ts -Pattern "prisma"

# 6. Check whether anything still uses the old pool
Get-ChildItem src -Recurse -Filter *.ts | Select-String -Pattern 'from "../db/pool.js"'
Get-ChildItem src -Recurse -Filter *.ts | Select-String -Pattern 'from "./db/pool.js"'
