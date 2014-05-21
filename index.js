var fs = require('fs');
var csv = require('csv');

var DIR = 'data/';

function Bayes(fileName) {
  this.fileName = fileName;
}

Bayes.prototype.classify = function (X, fn) {
  csv().from.path(DIR + this.fileName).to.array(function (arrayData) {
    var classSet = [];
    var trainedSet = [];

    var n = arrayData.length;
    var m = arrayData[0].length;
    // 遍历每一行数据
    for (var i = 1; i < n; i++) {
      // 判断是否存在此类，如果存在则更新对应项的数量
      for (var j = 0; j < classSet.length; j++) {
        if (arrayData[i][m - 1] === classSet[j].name) {
          classSet[j].count++;
          break;
        }
      }
      // 否则添加新的类项
      if (j === classSet.length) {
        classSet.push({ name: arrayData[i][m - 1], count: 1 });
      }
    }

    trainedSet = arrayData.slice(1, n - 1);

    // 计算各个分类的概率
    classSet.forEach(function (classItem) {
      // 计算训练集中每个类别的概率
      classItem.probability = classItem.count / (n - 1);
      classItem.xProbability = classItem.probability;

      // 计算 X 属于类别 classItem 的概率
      X.forEach(function (x, index) {
        var count = 0;
        trainedSet.forEach(function (dataItem) {
          if (dataItem[m - 1] === classItem.name && dataItem[index] === x) {
            count++
          }
        });
        // 把 Xi 乘到最终的结果中去
        classItem.xProbability *= count / classItem.count;
      });
    });

    // 计算概率值最大的分类
    var maxIndex = 0;
    for (var i = 1; i < classSet.length; i++) {
      if (classSet[i].xProbability > classSet[maxIndex].xProbability) {
        maxIndex = i;
      }
    }

    fn(X, classSet[maxIndex]);
  });
}
Bayes.prototype.test = function (x) {
  this.classify(x, function (X, classItem) {
    console.log("X:", X);
    console.log("result:", classItem.name);
    console.log();
  });
}


// test
var playBall = new Bayes('3-2-playball.csv');
playBall.test(['sunny', 'hot', 'high', 'weak']);
playBall.test(['sunny', 'hot', 'high', 'strong']);
playBall.test(['overcast', 'hot', 'high', 'weak']);
playBall.test(['rain', 'mild', 'high', 'weak']);
