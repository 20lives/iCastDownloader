# iCast AudioBooks Downloader

## Intro

The iCast audiobooks service is really good but I can't use it because of the need for constant network connection,
additinally the phone app UX is not optimal and has some bugs (Jumping between chapters, Stop playing for no reason, Not remembering last stop).
So i developed this tool so i could listen in my favourite audiobooks player.

## Usage

To use this you should have an active subscription to [iCast](https://icast.co.il) service.

The simplest way of using this is with `npx`, just run:
```
npx icastdownloader
```
and follow the instructions.

if you want to run it without `npx` just follow these command:

```
git clone https://github.com/20lives/iCastDownloader.git
cd iCastDownloader
npm run start
# or yarn start
```

## Todos

* Add ID3 tags to downloaded files

## Disclaimer

I am not responsible for any use of this program, please read [iCast terms of use](https://icast.co.il/%D7%AA%D7%9B%D7%A0%D7%99%D7%9D/%D7%AA%D7%A7%D7%A0%D7%95%D7%9F) before using this.
