// 引入依赖 node-csv
var csv = require('csv');

// 数据文件路径
var DIR = 'data/';

function Bayes(fileName) {
  this.fileName = fileName;
}

Bayes.prototype.classify = function (X, fn) {
  // TODO 初始化数据到对象中，不用回调
  // 从 csv 文件读取数据转换为数组，data 是一个二维数组，作为回调函数的一个参数
  csv().from.path(DIR + this.fileName).to.array(function (data) {
    // 类别对象集合
    // @name: 名称
    // @count: 数量
    // @probability: 先验概率 P(Y)
    // @xProbability: 类条件概率 P(X|Y)
    // @p: 先验概率与类条件概率的乘积，即最终用来确认哪个分类的概率
    // @avgs: 数组类型，存放连续型变量在该分类下的平均值
    // @stdPows: 数组类型，存放连续型变量在该分类下的方差
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
    // 训练集从第 1 行开始到最后一行
    trainedSet = data.slice(1, rows - 1);

    classSet.forEach(function (classItem) {
      classItem.avgs = [];
      classItem.stdPows = [];
      X.forEach(function (x, index) {
        if (typeof(x) === 'number') {
          var numberColumn = [];
          trainedSet.forEach(function (dataItem) {
            if (dataItem[columns - 1] === classItem.name) {
              numberColumn.push(dataItem[index]);
            }
          });
          var avg = 0;
          var stdPow = 0;
          numberColumn.forEach(function (number) {
            avg += parseInt(number);
          });
          avg /= numberColumn.length;
          numberColumn.forEach(function (number) {
            stdPow += Math.pow((number - avg), 2);
          });
          stdPow /= numberColumn.length;

          classItem.avgs[index] = avg;
          classItem.stdPows[index] = stdPow;
        }
      });
    });

    // 等价样本大小指定为：总数据量 / 类别数量 / 4
    // TODO 选择一个更合适的 m 值
    var m = rows / classSet.length / 4;

    // 计算各个分类的概率
    classSet.forEach(function (classItem) {
      // 计算训练集中每个类别的概率
      classItem.probability = classItem.count / (rows - 1);
      classItem.xProbability = 1;
      // p 用于 m 估计方法中的先验概率，这里指定为类别的先验概率
      var p = classItem.probability;

      // 计算 X 属于类别 classItem 的概率
      X.forEach(function (x, index) {
        var xP;
        if (typeof(x) === 'string') {
          var count = 0;
          trainedSet.forEach(function (dataItem) {
            if (dataItem[columns - 1] === classItem.name &&
                dataItem[index] === x) {
              count++
            }
          });
          xP = (count + m * p) / (classItem.count + m);
        } else if (typeof(x) === 'number') {
          // 对于连续型数据，假设服从高斯分布，计算其条件概率
          xP = (Math.pow(Math.E, -Math.pow(x - classItem.avgs[index], 2) /
               (2 * classItem.stdPows[index]))) / (Math.sqrt(2 * Math.PI) *
               Math.sqrt(classItem.stdPows[index]));

        }
        classItem.xProbability *= xP;
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

var credit = new Bayes('3-1-credit.csv');
credit.test(['yes', 'single', 125]);
credit.test(['no', 'married', 100]);
credit.test(['no', 'single', 70]);
credit.test(['yes', 'married', 120]);
credit.test(['no', 'divorced', 95]);
credit.test(['no', 'married', 60]);
credit.test(['yes', 'divorced', 220]);
credit.test(['no', 'single', 85]);
