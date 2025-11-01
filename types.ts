/**
 * В этом файле описаны основные типы данных на TypeScript.
 *
 * В TypeScript есть массивы, а в базах данных такого типа данных, как
 * массив внешних ключей с проверкой целостности - нет. Поэтому во второй
 * части отдельно описаны типы баз данных.
 */

// Вспомогательные типы

// Универсальный идентификатор, чтобы легче было синкать разные хранилища
type UUID1 = unknown
type DateTime = unknown

// Часть 1: Чистый TypeScript

namespace TS {
  // Выбирает 'id' из объекта, для наглядности
  type Ref<T> = 'id' extends keyof T ? T['id'] : never

  // Итак, есть 2 основных типа объекта: сущность (Entity) и блок (Block)

  /**
   * Entity (сущность) - всё, что мы комментируем: книги, фильмы, люди, события и т.д.
   *
   * Организованы иерархически, своего содержимого (тела) не имеют
   * Заголовки в UI выглядят как "book/Author1/Title1", однако в title хранится только
   * последний (значащий) чанк пути - "Title1", остальное - ссылки на родителей
   */
  type Entity = {
    id: UUID1
    // Собственный заголовок сущности
    title: string
    // Ссылка на родительскую сущность
    parentEntityId: Ref<Entity>
    createdAt: DateTime
  }

  /**
   * Block (блок) - свободные комментарии и комментарии к сущностям.
   * Любой блок анонимен, у него нет заголовка.
   * Выстраиваются в иерархию.
   *
   */
  type Block = {
    id: UUID1
    // В UI - это текст, в котором могут встречаться внутренние ссылки, то есть
    // ссылки на блоки и другие сущности. Поэтому на уровне модели это массив, который
    // во время рендера объединяется в строку.
    content: Ref<BlockContentChunk>[]
    // В UI - это вложенные блоки первого уровня, то есть, непосредственные дети
    children: Ref<Block>[]
    createdAt: DateTime
  }

  /**
   * BlockChunk (чанк блока) - это кусок текста блока, который может быть к тому же внутренней ссылкой
   */
  type BlockContentChunk = {
    id: UUID1
    text: string
    ref?: Ref<Block> | Ref<Entity>
  }
}

// Часть 2: TypeScript для DB

namespace DB {
  type PK<T> = T
  type FK<T, K = 'id'> = K extends keyof T ? T[K] : never
  type Unique<T> = T

  type Entity = {
    id: PK<UUID1>
    title: string
    // Поскольку порядок следования вложенных сущностей не важен, используем механизм ссылки на родителя
    parentEntityId: FK<Entity, 'id'>
    createdAt: DateTime
  }

  type Block = {
    id: PK<UUID1>
    createdAt: DateTime
    // Порядок следования блоков важен, используем ссылку на следующий (sibling) блок, уникальная
    nextBlockId: Unique<FK<Block>>
    // Если есть вложенные блоки, ссылаемся на первый, уникальная
    childBlockId: Unique<FK<Block>>
    // Порядок следования чанков важен, используем ссылку на первый чанк, уникальная
    firstChunkId: Unique<FK<Chunk>>
  }

  type Chunk = {
    id: PK<UUID1>
    text: string
    // Из двух следующих полей заполняется только одно
    blockRef?: FK<Block>
    entityRef?: FK<Entity>
    // Порядок следования чанков важен, используем ссылку на следующий (sibling) чанк, уникальная
    nextChunkId: Unique<FK<Chunk>>
  }
}
