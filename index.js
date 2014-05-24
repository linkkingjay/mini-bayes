var csv = require('csv');

var DIR = 'data/';

function Bayes(fileName) {
  this.fileName = fileName;
}

Bayes.prototype.classify = function (X, fn) {
  // 从 csv 文件读取数据转换为数组，data 是一个二维数组，作为回调函数的一个参数
  csv().from.path(DIR + this.fileName).to.array(function (data) {
    //
    // 类别对象集合
    // @name: 名称
    // @count: 数量
    // @probability: 先验概率 P(Y)
    // @xProbability: 类条件概率 P(X|Y)
    // @p: 先验概率与类条件概率的乘积，即最终用来确认哪个分类的概率
    //
    var classSet = [];
    // 训练集
    var trainedSet = [];

    var rows = data.length;
    var columns = data[0].length;

    // 遍历每一行数据
    for (var i = 1; i < rows; i++) {
      // 判断是否存在此类，如果存在则更新对应项的数量
      for (var j = 0; j < classSet.length; j++) {
        if (data[i][columns - 1] === classSet[j].name) {
          classSet[j].count++;
          break;
        }
      }
      // 否则添加新的类项
      if (j === classSet.length) {
        classSet.push({ name: data[i][columns - 1], count: 1 });
      }
    }

    // 训练集从第一行开始到最后一行
    trainedSet = data.slice(1, rows - 1);

    // 计算各个分类的概率
    classSet.forEach(function (classItem) {
      // 计算训练集中每个类别的概率
      classItem.probability = classItem.count / (rows - 1);
      classItem.xProbability = classItem.probability;

      // 计算 X 属于类别 classItem 的概率
      X.forEach(function (x, index) {
        var count = 0;
        trainedSet.forEach(function (dataItem) {
          if (dataItem[columns - 1] === classItem.name && 
              dataItem[index] === x) {
            count++
          }
        });
        // 把 Xi 乘到最终的结果中去
        classItem.xProbability *= count / classItem.count;
      });

      classItem.p = classItem.probability * classItem.xProbability;
    });

    // 计算概率值最大的分类
    var maxIndex = 0;
    for (var i = 1; i < classSet.length; i++) {
      if (classSet[i].p > classSet[maxIndex].p) {
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
