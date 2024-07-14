# viii
Game: Pieces of 8

Pieces of Eight (https://grelf.itch.io/viii) is a game inspired by the July 2024 "Random Generation" game jam on itch run by Portland Indie Game Squad (PIGS). Inspiration also came from reading the Wikipedia article about Pieces of Eight.

It is a kind of open world RPG: the terrain is limitless, with dungeons everywhere, and roles come into it. Some things only work if you are in an appropriate role.

Your aim is to find a number of objects, the nature and quantity of which you might guess from the title. Before you can find them though you will need to find some tools and some information about where things are. There is a help file available when you run the program.

Every time you start the program the terrain will be randomly different but if you like a particular game you can save the whole state and reload it another time. That is subject to space being available in your browser's local storage, but each saved game only takes about 8 kilobytes. It also assumes you have not set your browser to clear data on exit.

This new game is a development of games I had already made but introducing much more randomness, in line with the Portland game jam. The original version is The Forest (https://grelf.itch.io/forest) a key feature of which is its limitless terrain, generated in real time as the player moves around and explores. Another important feature is that it is written in plain vanilla JavaScript (JS) to run in (probably) all graphical browsers, using a 2D canvas. One of my motives is to demonstrate what can be done in such an environment without any other libraries or frameworks. Another motive is to encourage others to exploit the creative medium of vanilla JS in browsers and to this end I am making many of my source files available on github.

I have already documented how my terrain generator works and the details may be found in the file TerrainGeneration.pdf at https://github.com/grelf-net/forest.

The new game (Pieces of Eight) takes the idea further by generating the initial profile for the terrain randomly at the start of the program. This introduced some interesting programming challenges for me and I will describe each of them in some detail below.

- The initial profile must be created as a sum of sine waves.

- Certain objects required for game play must be placed in the terrain in "safe" places, such as not way out at sea but with several other constraints too.

- The terrain is different every time so it is important to enable users to save and reload games.
