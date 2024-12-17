const {MongoClient} = require('mongodb');
const {faker} = require('@faker-js/faker'); // пакет для генерации случайных данных

const a;

const url = 'mongodb://localhost:27117';
const client = new MongoClient(url);
// Задать имя базы данных
const dbName = 'module-02';

async function main() {
    // Подключиться к серверу
    await client.connect();
    console.log('Подключение к серверу выполнено');
    const db = client.db(dbName);
    // Выбрать коллекцию
    const collection = db.collection('students');

    let isExistCollection = await collection.countDocuments();
    // Если коллекция НЕ существует
    if (isExistCollection <= 100000) {
        // Создать коллекцию

        // Начало измерения времени
        let start = performance.now();
        for (let i = 0; i < 1000; i++) {
            const coursesCount = Math.floor(Math.random() * 5) + 1; // От 1 до 5 курсов
            const courses = Array.from({ length: coursesCount }, () => ({
                name: faker.word.words(2),
                nameCourse: faker.science.unit(),
                room: faker.number.romanNumeral(),
                lastName: faker.person.lastName()
            }));

            const document = {
                index: i,
                isActive: Math.random() < 0.5,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                gender: Math.random() < 0.5 ? 'male' : 'female',
                birthday: faker.date.between(
                    { from: '2002-01-01T00:00:00.000Z',
                        to: '2004-01-01T00:00:00.000Z' }).toISOString(),
                courses: courses,
            };

            await collection.insertOne(document);
            // if (i % 1000 === 0) {
            //     console.log(`${i} документов добавлено...`);
            // }
        }
        // Конец измерения времени
        let end = performance.now();
        console.log(`Потребовалось времени: ${(end - start).toFixed(2)} мс`);
        isExistCollection = await collection.countDocuments();
    }
    console.log(`В коллекции ${isExistCollection} документов`);

    // Получить все записи из коллекции
    console.log("\tCountDocuments");
    // Начало измерения времени
    let start = performance.now();
    let result = await collection.countDocuments();
    // Конец измерения времени
    let end = performance.now();
    console.log(`Потребовалось времени: ${(end - start).toFixed(2)} мс`);
    console.log(`В коллекции найдено ${result} документов.`);

    // Задание 1. Используем цепочку методов
    console.log('Задание 1. Используем цепочку методов');
    result = await collection.find({})
        .sort({ "birthday": -1 }) // Сортировка по дате рождения (по убыванию)
        .skip(10) // Пропуск первых 10 документов
        .limit(2) // Ограничение до 2 документов
        .toArray();
    if (result.length > 0) {
        console.log(`Найдено ${result.length} записей`);
        console.log(result[0]);
    } else {
        console.log('Документы, соответствующие критериям, не найдены.');
    }

    // Задание 2. Используем фильтрацию
    console.log('Задание 2. Используем фильтрацию');
    result = await collection.find({
        // Фильтрация по имени (ключу), где присутствует "Delores" (без учета регистра)
        firstName: { $regex: /lo/i },
        // Фильтрация по фамилии в массиве курсов
        "courses.lastName": { $regex: /^La/i }
    })
        .sort({ "birthday": -1 }) // Сортировка по дате рождения (по убыванию)
        .toArray();
    if (result.length > 0) {
        console.log(`Найдено ${result.length} записей`);
        console.log(result[0]);
    } else {
        console.log('Документы, соответствующие критериям, не найдены.');
    }

    // Задание 3. Используем условные и логические операции
    console.log('Задание 3. Используем условные и логические операции');
    result = await collection.find({
        $and: [
            // Фильтрация по имени (ключу), где присутствует "lo" (без учета регистра)
            {firstName: { $regex: /lo/i }},
            { birthday: { $gt: new Date("2003-01-01").toISOString() } }
        ]
    })
        .sort({ "birthday": -1 }) // Сортировка по дате рождения (по убыванию)
        .toArray();
    if (result.length > 0) {
        console.log(`Найдено ${result.length} записей`);
        console.log(result[0]);
    } else {
        console.log('Документы, соответствующие критериям, не найдены.');
    }

    // Задание 4. Используем текстовый индекс
    console.log('Задание 4. Используем текстовый индекс');
    // Создание текстового индекса
    await collection.createIndex({
        firstName: "text",
        lastName: "text"
    });
    console.log("Текстовый индекс создан.");

    // Поиск по слову "Delores" с выводом степени релевантности
    const searchWord = "Delores";
    result = await collection
        .find({
                $and: [
                    {$text: { $search: searchWord } },
                    { birthday: { $lt: new Date("2003-01-01").toISOString() } }
                ]
            },
            // Выводим степень релевантности
            {
                projection: {
                    score: { $meta: "textScore" },
                    firstName: 1,
                    lastName: 1
                }
            }
        )
        // Сортировка по степени релевантности
        .sort({ score: { $meta: "textScore" } })
        .toArray();
    if (result.length > 0) {
        console.log(`Найдено ${result.length} записей`);
        result.forEach((doc) => {
            console.log(`ИД: ${doc._id}, Имя: ${doc.firstName}, Фамилия: ${doc.lastName}, Релевантность: ${doc.score}`);
        });
    } else {
        console.log('Документы, соответствующие критериям, не найдены.');
    }

    return 'Все выполнено.';
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());