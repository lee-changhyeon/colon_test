const Sequelize = require('sequelize');

class Waiting extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    comment: 'waiting index',
                },
                study_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    comment: '인퍼런스 진행될 검진 ID',
                },
                study_instance_uid: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    comment: '인퍼런스 진행될 검진의 인스턴스 UID',
                },
                study_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: false
                }
            },
            {
                sequelize,
                timestamps: true, // true로 해놓으면 createdAt, updatedAt 자동추가
                underscored: true, // true면 created_At  // false면 createdAt
                modelName: 'Waiting', // sequelize의 모델 이름
                tableName: 'waiting', // mysql의 테이블 이름
                paranoid: false, // true면 삭제 날짜 기록 (e.g.회원탈퇴 후 1년간 보관한다는 약정 있는 경우 사용)
                charset: 'utf8', // 언어셋  // utf8 해줘야 한글 사용 가능  // utf8mb4는 이모티콘까지 가능
                collate: 'utf8_general_ci', // utf8_general_ci  // utf8mb4_general_ci
            },
        );
    }
};

module.exports = Waiting;